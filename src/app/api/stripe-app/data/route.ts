import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { platform } from "@/lib/stripe";
import { appUrl, money } from "@/lib/format";
import { isActive, recoveredCents, type Account } from "@/lib/auth";
import { FREE_RECOVERY_CENTS, PLANS, type PlanId } from "@/lib/plans";
import { mintLinkToken } from "@/lib/stripe-app";

// Called from the DeclineKit views inside the Stripe Dashboard. They run in a sandboxed
// iframe with a null origin, so CORS is open; every request must carry a Stripe signature.
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Stripe-Signature",
};
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: CORS });

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

type Body = { user_id?: string; account_id?: string; view?: string; object_id?: string | null };

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return json({ error: "bad request" }, 400);
  }
  const { user_id, account_id } = body;
  try {
    // Field order matters: user_id, then account_id.
    platform().webhooks.signature!.verifyHeader(
      JSON.stringify({ user_id, account_id }),
      req.headers.get("stripe-signature") ?? "",
      process.env.STRIPE_APP_SIGNING_SECRET!,
    );
  } catch {
    return json({ error: "bad signature" }, 401);
  }
  if (!account_id || !/^acct_\w+$/.test(account_id)) return json({ error: "bad request" }, 400);

  const dashboard_url = `${appUrl()}/app`;
  const [account] = (await sql`SELECT * FROM accounts WHERE stripe_account_id = ${account_id}
                               AND stripe_connection = 'app'`) as Account[];
  if (!account) {
    return json({ linked: false, dashboard_url, link_url: `${appUrl()}/api/stripe-app/link?t=${encodeURIComponent(mintLinkToken(account_id))}` });
  }

  const recovered = await recoveredCents(account.id);
  const paid = account.subscription_status === "active" || account.subscription_status === "past_due";
  const daysLeft = Math.max(0, Math.ceil((new Date(account.trial_ends_at).getTime() - Date.now()) / 86400_000));
  const free_status = paid
    ? undefined
    : account.stripe_livemode === false
      ? "Sandbox install: always free, and test recoveries don't count toward your free $100."
    : isActive(account, recovered)
      ? `Free until we recover $100 for you: ${money(recovered)} so far, ${daysLeft} days left.`
      : recovered >= FREE_RECOVERY_CENTS
        ? "Your free $100 is used up. Pick a plan at declinekit.com to keep recovering."
        : "Your free period has ended. Pick a plan at declinekit.com to keep recovering.";

  const [s] = await sql`
    SELECT
      COALESCE(SUM(amount_cents) FILTER (WHERE status = 'recovered' AND recovered_at > date_trunc('month', now())), 0) AS month,
      COALESCE(SUM(amount_cents) FILTER (WHERE status = 'recovered'), 0) AS all_time,
      COALESCE(SUM(amount_cents) FILTER (WHERE status = 'open'), 0) AS open_cents,
      COUNT(*) FILTER (WHERE status = 'open') AS open_count,
      COALESCE(MAX(currency), 'usd') AS currency
    FROM failed_invoices WHERE account_id = ${account.id}`;
  const [e] = await sql`SELECT COUNT(*) AS n FROM expiring_reminders
                        WHERE account_id = ${account.id} AND card_updated_at IS NULL AND sent_at > now() - interval '45 days'`;
  const cur = s.currency as string;

  let cases: unknown[] | undefined;
  if ((body.view === "customer" || body.view === "invoice") && body.object_id) {
    const rows = body.view === "customer"
      ? await sql`SELECT * FROM failed_invoices WHERE account_id = ${account.id} AND stripe_customer_id = ${body.object_id}
                  ORDER BY failed_at DESC LIMIT 20`
      : await sql`SELECT * FROM failed_invoices WHERE account_id = ${account.id} AND stripe_invoice_id = ${body.object_id}`;
    cases = rows.map((r) => ({
      invoice_id: r.stripe_invoice_id,
      customer_id: r.stripe_customer_id,
      customer: r.customer_name ?? r.customer_email,
      amount: money(r.amount_cents, r.currency),
      status: r.status,
      recovered_via: r.recovered_via,
      emails_sent: r.emails_sent,
      failed_at: new Date(r.failed_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    }));
  }

  return json({
    linked: true,
    dashboard_url,
    emails_enabled: account.emails_enabled,
    plan: paid ? PLANS[account.plan as PlanId]?.name ?? "Paid" : "Free",
    free_status,
    recovered_month: money(s.month as number, cur),
    recovered_all: money(s.all_time as number, cur),
    open_amount: money(s.open_cents as number, cur),
    open_count: Number(s.open_count),
    expiring_soon: Number(e.n),
    cases,
  });
}
