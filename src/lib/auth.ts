import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { describeVisit } from "./first-touch";
import { sql } from "./db";
import { getSessionUser, type SessionUser } from "./session";
import { CLOUD } from "./config";
import { sendInternal, sendWelcome } from "./email";
import { PENDING_LINK_COOKIE } from "./stripe-app";
import { FREE_DAYS, FREE_RECOVERY_CENTS } from "./plans";

export type Account = {
  id: string;
  email: string;
  brand_name: string | null;
  from_name: string | null;
  reply_to: string | null;
  stripe_key_enc: string | null;
  stripe_connection: "key" | "app" | null;
  app_installed_at: string | null;
  stripe_livemode: boolean;
  stripe_account_id: string | null;
  stripe_account_name: string | null;
  webhook_endpoint_id: string | null;
  webhook_secret_enc: string | null;
  billing_customer_id: string | null;
  billing_subscription_id: string | null;
  plan: string | null;
  subscription_status: string;
  trial_ends_at: string;
  created_at: string;
  emails_enabled: boolean;
};

// Neon Auth owns identity; an `accounts` row holds everything DeclineKit-specific.
// Sign-in (Neon Auth on Cloud, built-in codes when self-hosted) owns identity; an `accounts`
// row holds everything DeclineKit-specific.
export async function currentAccount(): Promise<Account | null> {
  const user = await getSessionUser();
  return user ? ensureAccount(user) : null;
}

// Finds the account for a signed-in user, creating it on first sign-in.
export async function ensureAccount(user: SessionUser): Promise<Account> {
  const email = user.email.toLowerCase();
  let rows = await sql`SELECT * FROM accounts WHERE auth_user_id = ${user.id}`;
  if (!rows[0]) {
    rows = await sql`INSERT INTO accounts (email, reply_to, auth_user_id, trial_ends_at)
      VALUES (${email}, ${email}, ${user.id}, now() + make_interval(days => ${FREE_DAYS}))
      ON CONFLICT (email) DO UPDATE SET auth_user_id = EXCLUDED.auth_user_id RETURNING *, (xmax = 0) AS created`;
    if (rows[0].created) {
      let visit = "";
      let connecting = false;
      try {
        const [c, h] = await Promise.all([cookies(), headers()]);
        visit = describeVisit((n) => c.get(n)?.value, (n) => h.get(n));
        connecting = !!c.get(PENDING_LINK_COOKIE);
      } catch {}
      await Promise.all([
        sendInternal(`New signup: ${email}`, `Someone started a trial.\n\n${visit}`.trim()),
        CLOUD ? sendWelcome(email, connecting) : Promise.resolve(),
      ]);
    }
  }
  return rows[0] as Account;
}

export async function requireAccount(): Promise<Account> {
  const account = await currentAccount();
  if (!account) redirect("/login");
  return account;
}

// Recoveries DeclineKit can prove it caused: the customer paid through our card-update link.
// Payments Stripe's own retries collected don't count toward the free allowance, and
// neither does sandbox money (test installs, including Stripe's app reviewers).
export async function recoveredCents(accountId: string) {
  const [r] = await sql`SELECT COALESCE(SUM(amount_cents), 0) AS cents FROM failed_invoices
                        WHERE account_id = ${accountId} AND status = 'recovered' AND recovered_via = 'card_update'
                          AND livemode`;
  return Number(r.cents);
}

// Dunning emails go out on a paid plan, or while the free allowance lasts: until we've
// recovered FREE_RECOVERY_CENTS for the account or FREE_DAYS have passed.
// Sandbox installs (our tests, Stripe's app reviewers) are always on: no real money moves.
// Two different things share Stripe's word "trialing": DeclineKit's own free period (no Stripe
// subscription yet), and a paid plan chosen during the free period, which Stripe holds in a trial
// until the free period ends. A billing_subscription_id tells them apart.
type Billing = Pick<Account, "subscription_status" | "billing_subscription_id">;
export const hasPlan = (a: Billing) =>
  !!a.billing_subscription_id && ["trialing", "active", "past_due"].includes(a.subscription_status);
export const onFreePeriod = (a: Billing) => a.subscription_status === "trialing" && !a.billing_subscription_id;

// When a plan chosen now would start billing: the end of the free period, if it's still running
// (and at least 48 hours away, Stripe's minimum trial), otherwise null for "bill today".
export async function freePeriodEnd(a: Account): Promise<Date | null> {
  if (!onFreePeriod(a)) return null;
  const end = new Date(a.trial_ends_at);
  if (end.getTime() < Date.now() + 48 * 3600_000) return null;
  return (await recoveredCents(a.id)) < FREE_RECOVERY_CENTS ? end : null;
}

export function isActive(a: Pick<Account, "subscription_status" | "trial_ends_at" | "stripe_livemode" | "billing_subscription_id">, recovered: number) {
  if (!CLOUD) return true; // self-hosted: no plans, no limits
  if (a.stripe_livemode === false) return true;
  if (hasPlan(a)) return true;
  return onFreePeriod(a) && new Date(a.trial_ends_at) > new Date() && recovered < FREE_RECOVERY_CENTS;
}
