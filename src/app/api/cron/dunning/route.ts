import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { clientFor } from "@/lib/stripe";
import { isActive, recoveredCents, type Account } from "@/lib/auth";
import { DUNNING_STEPS, STEP_OFFSET_HOURS, sendDunningEmail } from "@/lib/email";
import { markLost, markRecovered } from "@/lib/recovery";
import { appUrl } from "@/lib/format";
import { pruneRateLimits } from "@/lib/rate-limit";
import { remainingSends } from "@/lib/send-cap";

export const maxDuration = 300;

type Due = {
  id: string; account_id: string; stripe_invoice_id: string; customer_email: string | null;
  customer_name: string | null; amount_cents: number; currency: string; update_token: string;
  emails_sent: number; failed_at: string;
};

export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("unauthorized", { status: 401 });
  }
  const due = (await sql`
    SELECT f.* FROM failed_invoices f JOIN accounts a ON a.id = f.account_id
    WHERE f.status = 'open' AND f.next_email_at <= now() AND a.emails_enabled
    ORDER BY f.next_email_at LIMIT 200`) as Due[];

  await pruneRateLimits();
  const accounts = new Map<string, Account>();
  const budget = new Map<string, number>();
  const active = new Map<string, boolean>();
  let sent = 0;
  for (const f of due) {
    let account = accounts.get(f.account_id);
    if (!account) {
      account = (await sql`SELECT * FROM accounts WHERE id = ${f.account_id}`)[0] as Account;
      accounts.set(f.account_id, account);
      budget.set(account.id, await remainingSends(account));
      active.set(account.id, isActive(account, await recoveredCents(account.id)));
    }
    if (!active.get(account.id)) continue;
    // Over the daily cap: leave it due, and the next hourly run picks it up once there's room.
    if (budget.get(account.id)! <= 0) continue;
    try {
      // Re-check Stripe right before emailing so we never chase a paid invoice.
      const inv = await clientFor(account).invoices.retrieve(f.stripe_invoice_id);
      if (inv.status === "paid") { await markRecovered(account.id, inv.id!, "retry"); continue; }
      if (inv.status === "void" || inv.status === "uncollectible") { await markLost(account.id, inv.id!); continue; }
      if (!f.customer_email) {
        await sql`UPDATE failed_invoices SET next_email_at = NULL WHERE id = ${f.id}`;
        continue;
      }
      const brand = account.brand_name ?? account.stripe_account_name ?? "your subscription";
      const providerId = await sendDunningEmail({
        step: f.emails_sent, brand, fromName: account.from_name ?? brand, replyTo: account.reply_to ?? account.email,
        to: f.customer_email, customerName: f.customer_name, amountCents: f.amount_cents,
        currency: f.currency, link: `${appUrl()}/u/${f.update_token}`,
      });
      const step = f.emails_sent + 1;
      const next = step < DUNNING_STEPS
        ? new Date(new Date(f.failed_at).getTime() + STEP_OFFSET_HOURS[step] * 3600_000)
        : null;
      // Never schedule two emails less than a day apart (matters for backfilled invoices).
      const floor = new Date(Date.now() + 24 * 3600_000);
      const nextAt = next ? (next < floor ? floor : next).toISOString() : null;
      await sql`INSERT INTO email_log (failed_invoice_id, step, provider_id) VALUES (${f.id}, ${f.emails_sent}, ${providerId})`;
      await sql`UPDATE failed_invoices SET emails_sent = ${step}, next_email_at = ${nextAt} WHERE id = ${f.id}`;
      budget.set(account.id, budget.get(account.id)! - 1);
      sent++;
    } catch (e) {
      console.error("dunning failed", f.id, e);
      await sql`UPDATE failed_invoices SET next_email_at = now() + interval '6 hours' WHERE id = ${f.id}`;
    }
  }
  return NextResponse.json({ due: due.length, sent });
}
