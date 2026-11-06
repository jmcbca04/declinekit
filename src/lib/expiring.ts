import Stripe from "stripe";
import { sql } from "./db";
import { randomToken } from "./crypto";
import { appUrl } from "./format";
import { clientFor } from "./stripe";
import { sendExpiringEmail } from "./email";
import { remainingSends } from "./send-cap";
import type { Account } from "./auth";

// Remind customers whose card will be dead by their next renewal, up to this far ahead.
const LOOKAHEAD_DAYS = 45;

export type ExpiringCard = {
  subscriptionId: string;
  customerId: string;
  email: string;
  name: string | null;
  paymentMethodId: string;
  cardBrand: string;
  last4: string;
  expires: Date; // first moment the card no longer works
  expiresKey: string; // YYYY-MM
  renewsOn: Date;
};

function cardOf(sub: Stripe.Subscription): Stripe.PaymentMethod | null {
  const own = sub.default_payment_method;
  if (own && typeof own !== "string") return own;
  const customer = sub.customer;
  if (customer && typeof customer !== "string" && !customer.deleted) {
    const dflt = customer.invoice_settings?.default_payment_method;
    if (dflt && typeof dflt !== "string") return dflt;
  }
  return null;
}

// `testClock` exists only for tests: Stripe omits test-clock subscriptions from lists unless asked.
type ScanOptions = { now?: Date; testClock?: string };

export async function findExpiringCards(stripe: Stripe, { now = new Date(), testClock }: ScanOptions = {}): Promise<ExpiringCard[]> {
  const horizon = now.getTime() + LOOKAHEAD_DAYS * 86400_000;
  const found: ExpiringCard[] = [];
  for (const status of ["active", "trialing"] as const) {
    const subs = stripe.subscriptions.list({
      status,
      limit: 100,
      expand: ["data.default_payment_method", "data.customer.invoice_settings.default_payment_method"],
      ...(testClock ? { test_clock: testClock } : {}),
    });
    for await (const sub of subs) {
      if (sub.cancel_at_period_end || sub.collection_method !== "charge_automatically") continue;
      const pm = cardOf(sub);
      const card = pm?.card;
      if (!pm || !card) continue;
      const renewsAt = Math.min(...sub.items.data.map((i) => i.current_period_end)) * 1000;
      const expires = new Date(Date.UTC(card.exp_year, card.exp_month, 1)); // cards work through the end of exp_month
      if (expires.getTime() > renewsAt || expires.getTime() > horizon || expires.getTime() <= now.getTime()) continue;
      const customer = sub.customer as Stripe.Customer;
      if (!customer.email) continue;
      found.push({
        subscriptionId: sub.id,
        customerId: customer.id,
        email: customer.email,
        name: customer.name ?? null,
        paymentMethodId: pm.id,
        cardBrand: card.brand,
        last4: card.last4,
        expires,
        expiresKey: `${card.exp_year}-${String(card.exp_month).padStart(2, "0")}`,
        renewsOn: new Date(renewsAt),
      });
    }
  }
  return found;
}

// Sends at most one reminder per card per expiry. Returns how many were sent.
export async function sendExpiringReminders(account: Account, opts: ScanOptions = {}): Promise<number> {
  let budget = await remainingSends(account);
  if (budget <= 0) return 0;
  const cards = await findExpiringCards(clientFor(account), opts);
  const brand = account.brand_name ?? account.stripe_account_name ?? "your subscription";
  let sent = 0;
  for (const c of cards) {
    // Unclaimed cards are simply picked up by tomorrow's run.
    if (budget <= 0) break;
    const token = randomToken(18);
    const claimed = await sql`
      INSERT INTO expiring_reminders (account_id, stripe_customer_id, stripe_subscription_id, payment_method_id,
        card_expires, customer_email, customer_name, update_token)
      VALUES (${account.id}, ${c.customerId}, ${c.subscriptionId}, ${c.paymentMethodId}, ${c.expiresKey},
        ${c.email}, ${c.name}, ${token})
      ON CONFLICT (account_id, payment_method_id, card_expires) DO NOTHING RETURNING id`;
    if (!claimed[0]) continue;
    budget--;
    try {
      await sendExpiringEmail({
        to: c.email, fromName: account.from_name ?? brand, replyTo: account.reply_to ?? account.email,
        brand, customerName: c.name, cardBrand: c.cardBrand, last4: c.last4,
        expires: new Date(c.expires.getTime() - 86400_000), renewsOn: c.renewsOn, link: `${appUrl()}/c/${token}`,
      });
      sent++;
    } catch (e) {
      // Release the claim so tomorrow's run retries this card.
      await sql`DELETE FROM expiring_reminders WHERE id = ${claimed[0].id}`;
      console.error("expiring reminder failed", account.id, c.paymentMethodId, e);
    }
  }
  return sent;
}
