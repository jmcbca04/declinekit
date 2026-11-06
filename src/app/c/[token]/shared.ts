import { sql } from "@/lib/db";
import type { Account } from "@/lib/auth";

export type Reminder = {
  id: string; account_id: string; stripe_customer_id: string; stripe_subscription_id: string;
  card_updated_at: string | null;
};

export async function loadReminder(token: string) {
  const r = (await sql`SELECT * FROM expiring_reminders
                       WHERE update_token = ${token} AND sent_at > now() - interval '60 days'`)[0] as Reminder | undefined;
  if (!r) return null;
  const account = (await sql`SELECT * FROM accounts WHERE id = ${r.account_id}`)[0] as Account;
  const brand = account.brand_name ?? account.stripe_account_name ?? "your subscription";
  return { r, account, brand };
}
