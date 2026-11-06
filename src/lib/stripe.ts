import Stripe from "stripe";
import { decrypt } from "./crypto";

// Our own Stripe account: bills DeclineKit subscriptions. Created lazily so builds
// don't need the secret.
let _platform: Stripe | undefined;
export function platform() {
  return (_platform ??= new Stripe(process.env.STRIPE_SECRET_KEY!));
}

type Connection = {
  stripe_key_enc: string | null;
  stripe_connection?: "key" | "app" | null;
  stripe_account_id: string | null;
  stripe_livemode?: boolean;
};

// Our key for acting on app installs: live installs use the live key, sandbox installs
// use the app's managed-sandbox key.
export const appKey = (livemode: boolean) =>
  livemode
    ? process.env.STRIPE_APP_SECRET_KEY ?? process.env.STRIPE_SECRET_KEY!
    : process.env.STRIPE_APP_SANDBOX_SECRET_KEY!;

export const isConnected = (a: Connection) =>
  a.stripe_connection === "app" ? !!a.stripe_account_id : !!a.stripe_key_enc;

// A customer's Stripe account. App installs use our platform key with the Stripe-Account
// header, limited by the permissions they approved; older connections use the restricted
// key they pasted.
export function clientFor(account: Connection) {
  if (account.stripe_connection === "app" && account.stripe_account_id) {
    return new Stripe(appKey(account.stripe_livemode !== false), { stripeAccount: account.stripe_account_id });
  }
  if (!account.stripe_key_enc) throw new Error("Stripe not connected");
  return new Stripe(decrypt(account.stripe_key_enc));
}

export function subscriptionIdOf(invoice: Stripe.Invoice): string | null {
  const sub = invoice.parent?.subscription_details?.subscription;
  if (!sub) return null;
  return typeof sub === "string" ? sub : sub.id;
}

export const customerIdOf = (invoice: Stripe.Invoice) =>
  typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id ?? "";

// Opens Stripe's "Create restricted key" form with the name and permissions pre-filled (e.g. "rak_invoice_read").
export const restrictedKeyUrl = (name: string, permissions: string[]) =>
  `https://dashboard.stripe.com/apikeys/create?${new URLSearchParams([["name", name], ...permissions.map((p) => ["permissions[]", p])])}`;

export { PLANS, type PlanId } from "./plans";
