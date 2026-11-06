import Stripe from "stripe";
import { sql } from "./db";
import { encrypt, randomToken } from "./crypto";
import { appUrl } from "./format";
import { clientFor, customerIdOf, subscriptionIdOf } from "./stripe";
import { STEP_OFFSET_HOURS, sendInternal } from "./email";
import type { Account } from "./auth";

export const WEBHOOK_EVENTS: Stripe.WebhookEndpointCreateParams.EnabledEvent[] = [
  "invoice.payment_failed",
  "invoice.paid",
  "invoice.voided",
  "invoice.marked_uncollectible",
];

// Only subscription invoices that Stripe tried to charge automatically are ours to chase.
export function isRecoverable(inv: Stripe.Invoice) {
  return (
    inv.collection_method === "charge_automatically" &&
    !!subscriptionIdOf(inv) &&
    inv.status === "open" &&
    inv.amount_remaining > 0 &&
    inv.attempt_count >= 1
  );
}

export async function recordFailure(accountId: string, inv: Stripe.Invoice, stripe: Stripe) {
  if (!isRecoverable(inv)) return;
  let email = inv.customer_email;
  let name = inv.customer_name;
  if (!email) {
    const c = await stripe.customers.retrieve(customerIdOf(inv));
    if (!c.deleted) {
      email = c.email;
      name = c.name ?? null;
    }
  }
  const nextAt = new Date(Date.now() + STEP_OFFSET_HOURS[0] * 3600_000);
  await sql`
    INSERT INTO failed_invoices (account_id, stripe_invoice_id, stripe_customer_id, customer_email,
      customer_name, amount_cents, currency, update_token, next_email_at, failed_at, livemode)
    VALUES (${accountId}, ${inv.id}, ${customerIdOf(inv)}, ${email}, ${name}, ${inv.amount_remaining},
      ${inv.currency}, ${randomToken(18)}, ${nextAt.toISOString()},
      LEAST(to_timestamp(${inv.status_transitions?.finalized_at ?? Math.floor(Date.now() / 1000)}), now()),
      ${inv.livemode !== false})
    ON CONFLICT (account_id, stripe_invoice_id) DO UPDATE
      SET amount_cents = EXCLUDED.amount_cents
      WHERE failed_invoices.status = 'open'`;
}

export async function markRecovered(accountId: string, invoiceId: string, via: string) {
  await sql`UPDATE failed_invoices SET status = 'recovered', recovered_at = now(), recovered_via = ${via},
              next_email_at = NULL
            WHERE account_id = ${accountId} AND stripe_invoice_id = ${invoiceId} AND status = 'open'`;
}

export async function markLost(accountId: string, invoiceId: string) {
  await sql`UPDATE failed_invoices SET status = 'lost', next_email_at = NULL
            WHERE account_id = ${accountId} AND stripe_invoice_id = ${invoiceId} AND status = 'open'`;
}

export class ConnectError extends Error {}

// Removes our webhook from the customer's Stripe account (best effort: the key may
// already be deleted) and forgets the key, so nothing more is sent or read. App installs
// have no per-account webhook; uninstalling the app in Stripe revokes our access.
export async function disconnectStripe(account: Account) {
  if (account.stripe_connection !== "app" && account.stripe_key_enc && account.webhook_endpoint_id) {
    try {
      await clientFor(account).webhookEndpoints.del(account.webhook_endpoint_id);
    } catch {}
  }
  await sql`UPDATE accounts SET stripe_key_enc = NULL, webhook_endpoint_id = NULL, webhook_secret_enc = NULL,
              stripe_account_id = NULL, stripe_connection = NULL, app_installed_at = NULL, emails_enabled = false
            WHERE id = ${account.id}`;
}

// Validates a restricted key, registers our webhook on the customer's account,
// and imports invoices that are failing right now so the dashboard isn't empty.
export async function connectStripe(account: Account, rawKey: string) {
  const key = rawKey.trim();
  // Restricted keys only. A full secret key would give us (and anyone who ever breached us)
  // refunds, payouts and everything else, so we refuse to store one.
  if (/^sk_/.test(key)) {
    throw new ConnectError("That's your secret key, which can do anything in Stripe. We didn't save it. Use the button above to create a restricted key instead.");
  }
  if (!/^rk_live_/.test(key) && !(process.env.ALLOW_TEST_KEYS && /^rk_test_/.test(key))) {
    throw new ConnectError("Paste a live restricted key. It starts with rk_live_.");
  }
  const stripe = new Stripe(key);
  try {
    await stripe.invoices.list({ limit: 1 });
  } catch {
    throw new ConnectError("That key can't read invoices. Check the permissions listed below and try again.");
  }

  let accountName: string | null = null;
  let accountId: string | null = null;
  try {
    const acct = await stripe.accounts.retrieveCurrent();
    accountId = acct.id;
    accountName = acct.settings?.dashboard?.display_name ?? acct.business_profile?.name ?? null;
  } catch {
    // Restricted keys may not be able to read account details; that's fine.
  }

  // Reconnecting: remove the old webhook with the old key, in case it's a different Stripe account.
  if (account.webhook_endpoint_id && account.stripe_key_enc) {
    try {
      await clientFor(account).webhookEndpoints.del(account.webhook_endpoint_id);
    } catch {}
  }
  let endpoint: Stripe.WebhookEndpoint;
  try {
    endpoint = await stripe.webhookEndpoints.create({
      url: `${appUrl()}/api/hooks/${account.id}`,
      enabled_events: WEBHOOK_EVENTS,
      description: "DeclineKit: failed payment recovery",
    });
  } catch {
    throw new ConnectError("That key can't create webhooks. Give it write access to Webhook Endpoints.");
  }

  await sql`UPDATE accounts SET stripe_connection = 'key', stripe_key_enc = ${encrypt(key)}, webhook_endpoint_id = ${endpoint.id},
              webhook_secret_enc = ${encrypt(endpoint.secret!)}, stripe_account_id = ${accountId},
              stripe_account_name = ${accountName},
              brand_name = COALESCE(brand_name, ${accountName}),
              from_name = COALESCE(from_name, ${accountName})
            WHERE id = ${account.id}`;

  await sendInternal(`Stripe connected: ${account.email}`, `Stripe account: ${accountName ?? "unknown"} (${accountId ?? "id hidden"})\nBrand: ${account.brand_name ?? accountName ?? "not set"}`);

  await importOpenFailures(account.id, stripe);
}

// Links a DeclineKit account to a Stripe account that installed the app, picks up the
// business name for the emails, and imports invoices that are failing right now.
export async function linkAppInstall(account: Account, stripeAccountId: string) {
  // Work out whether this is a live or sandbox install by asking Stripe with each key:
  // only the matching key can see the installed account.
  let livemode = true;
  let name: string | null = null;
  for (const mode of [true, false]) {
    try {
      const acct = await clientFor({ ...account, stripe_connection: "app", stripe_account_id: stripeAccountId, stripe_livemode: mode })
        .accounts.retrieve(stripeAccountId);
      livemode = mode;
      name = acct.settings?.dashboard?.display_name ?? acct.business_profile?.name ?? null;
      break;
    } catch (e) {
      if (!mode) console.error("install not visible with live or sandbox key", account.id, stripeAccountId, e);
    }
  }
  const linked = { ...account, stripe_connection: "app" as const, stripe_account_id: stripeAccountId, stripe_livemode: livemode };
  await sql`UPDATE accounts SET stripe_connection = 'app', stripe_account_id = ${stripeAccountId}, app_installed_at = now(),
              stripe_livemode = ${livemode}, stripe_key_enc = NULL, webhook_endpoint_id = NULL, webhook_secret_enc = NULL,
              stripe_account_name = COALESCE(${name}, stripe_account_name),
              brand_name = COALESCE(brand_name, ${name}), from_name = COALESCE(from_name, ${name})
            WHERE id = ${account.id}`;
  try {
    await importOpenFailures(account.id, clientFor(linked));
  } catch (e) {
    console.error("import after app link failed", account.id, e);
  }
}

// Brings in subscription invoices that are failing right now, so recovery can start at once.
export async function importOpenFailures(accountId: string, stripe: Stripe) {
  const since = Math.floor(Date.now() / 1000) - 21 * 86400;
  for await (const inv of stripe.invoices.list({ status: "open", created: { gte: since }, limit: 100 })) {
    await recordFailure(accountId, inv, stripe);
  }
}

// Shared by both webhook routes: per-account key connections and the Stripe App.
export async function handleInvoiceEvent(account: Account, event: Stripe.Event) {
  const inv = event.data.object as Stripe.Invoice;
  switch (event.type) {
    case "invoice.payment_failed":
      await recordFailure(account.id, inv, clientFor(account));
      break;
    case "invoice.paid":
      // If a customer clicked our link, the card-update page already marked it.
      // Anything else that gets paid while we're chasing it counts as a retry recovery.
      await markRecovered(account.id, inv.id!, "retry");
      break;
    case "invoice.voided":
    case "invoice.marked_uncollectible":
      await markLost(account.id, inv.id!);
      break;
  }
}

export type AuditResult = {
  currency: string;
  failedCents: number;
  failedCount: number;
  retriedCents: number;
  totalCents: number;
  recoverableCents: number;
  customers: number;
};

// 90-day look-back. "Failed" = subscription invoices still unpaid after Stripe tried to charge them.
export async function runAudit(key: string): Promise<AuditResult> {
  const stripe = new Stripe(key.trim());
  const since = Math.floor(Date.now() / 1000) - 90 * 86400;
  const r = { currency: "usd", failedCents: 0, failedCount: 0, retriedCents: 0, totalCents: 0, recoverableCents: 0, customers: 0 };
  const failedCustomers = new Set<string>();
  let n = 0;
  for await (const inv of stripe.invoices.list({ created: { gte: since }, limit: 100 })) {
    if (++n > 5000) break;
    if (!subscriptionIdOf(inv) || inv.collection_method !== "charge_automatically") continue;
    r.currency = inv.currency;
    r.totalCents += inv.amount_due;
    const unpaid = (inv.status === "open" || inv.status === "uncollectible") && inv.attempt_count >= 1;
    if (unpaid) {
      r.failedCents += inv.amount_remaining;
      r.failedCount++;
      failedCustomers.add(customerIdOf(inv));
    } else if (inv.status === "paid" && inv.attempt_count > 1) {
      r.retriedCents += inv.amount_paid;
    }
  }
  r.customers = failedCustomers.size;
  // Card-update emails typically win back 40-60% of involuntary churn; we quote the low end.
  r.recoverableCents = Math.round(r.failedCents * 0.4);
  return r;
}
