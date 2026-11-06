import { sql } from "./db";
import type { Account } from "./auth";

// Daily ceiling on customer emails per account. Trials are free and unverified, so they
// get a low cap: enough for a real backlog to drain over a few days, too little to be
// worth abusing our sending domain for. Paying accounts get far more headroom.
const TRIAL_CAP = 50;
const PAID_CAP = 1000;

export async function remainingSends(account: Account) {
  const cap = account.subscription_status === "active" || account.subscription_status === "past_due" ? PAID_CAP : TRIAL_CAP;
  const [r] = await sql`
    SELECT (SELECT count(*) FROM email_log l JOIN failed_invoices f ON f.id = l.failed_invoice_id
             WHERE f.account_id = ${account.id} AND l.sent_at > now() - interval '24 hours')
         + (SELECT count(*) FROM expiring_reminders
             WHERE account_id = ${account.id} AND sent_at > now() - interval '24 hours') AS n`;
  return Math.max(0, cap - Number(r.n));
}
