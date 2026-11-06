import Stripe from "stripe";
import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { platform } from "@/lib/stripe";
import { handleInvoiceEvent } from "@/lib/recovery";
import { sendInternal } from "@/lib/email";
import type { Account } from "@/lib/auth";

// One endpoint for every account that installed the DeclineKit Stripe App
// ("Listen to events on connected accounts"). event.account says whose event it is.
export async function POST(req: Request) {
  const body = await req.text();
  // Live installs send events to our live endpoint; sandbox installs to the managed
  // sandbox's endpoint. Both point here, each with its own signing secret.
  const sig = req.headers.get("stripe-signature") ?? "";
  let event: Stripe.Event | null = null;
  for (const secret of [process.env.STRIPE_APP_WEBHOOK_SECRET, process.env.STRIPE_APP_SANDBOX_WEBHOOK_SECRET]) {
    if (!secret) continue;
    try {
      event = platform().webhooks.constructEvent(body, sig, secret);
      break;
    } catch {}
  }
  if (!event) return new NextResponse("bad signature", { status: 400 });
  if (!event.account) return NextResponse.json({ received: true });

  const [account] = (await sql`SELECT * FROM accounts WHERE stripe_account_id = ${event.account}
                               AND stripe_connection = 'app'`) as Account[];
  // Installed in Stripe but not linked to a DeclineKit account yet: nothing to do.
  if (!account) return NextResponse.json({ received: true });

  if (event.type === "account.application.deauthorized") {
    await sql`UPDATE accounts SET stripe_connection = NULL, stripe_account_id = NULL, app_installed_at = NULL,
                emails_enabled = false WHERE id = ${account.id}`;
    await sendInternal(`Stripe App uninstalled: ${account.email}`, `Stripe account ${event.account}`);
  } else {
    await handleInvoiceEvent(account, event);
  }
  return NextResponse.json({ received: true });
}
