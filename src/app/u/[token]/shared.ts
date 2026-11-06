import { sql } from "@/lib/db";
import type { Account } from "@/lib/auth";

export type FailedInvoice = {
  id: string; account_id: string; stripe_invoice_id: string; stripe_customer_id: string;
  customer_email: string | null; amount_cents: number; currency: string; status: string; update_token: string; livemode: boolean;
};

export async function load(token: string) {
  // Links stop working 60 days after the failure; the email sequence is long over by then.
  const f = (await sql`SELECT * FROM failed_invoices
                       WHERE update_token = ${token} AND failed_at > now() - interval '60 days'`)[0] as FailedInvoice | undefined;
  if (!f) return null;
  const account = (await sql`SELECT * FROM accounts WHERE id = ${f.account_id}`)[0] as Account;
  const brand = account.brand_name ?? account.stripe_account_name ?? "your subscription";
  return { f, account, brand };
}
