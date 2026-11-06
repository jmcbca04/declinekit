import { requireAccount } from "@/lib/auth";
import { sql } from "@/lib/db";
import { money } from "@/lib/format";
import { dunningCopy, expiringCopy, STEP_OFFSET_HOURS } from "@/lib/email";
import { isConnected, restrictedKeyUrl } from "@/lib/stripe";
import { appInstallAvailable } from "@/lib/stripe-app";
import { ConnectForm } from "./connect-form";
import { setEmailsEnabled } from "./actions";

const PERMISSIONS: [string, string, string][] = [
  ["Customers", "Write", "rak_customer_write"],
  ["Invoices", "Write", "rak_invoice_write"],
  ["Subscriptions", "Write", "rak_subscription_write"],
  ["Checkout Sessions", "Write", "rak_checkout_session_write"],
  ["SetupIntents", "Read", "rak_setup_intent_read"],
  ["PaymentMethods", "Read", "rak_payment_method_read"],
  ["Webhook Endpoints", "Write", "rak_webhook_write"],
];
const KEY_URL = restrictedKeyUrl("DeclineKit", PERMISSIONS.map(([, , rak]) => rak));

type Row = {
  id: string; customer_email: string | null; customer_name: string | null; amount_cents: number;
  currency: string; status: string; failed_at: string; emails_sent: number; next_email_at: string | null;
  recovered_via: string | null;
};

const INSTALL_MESSAGES: Record<string, string> = {
  cancelled: "The install was cancelled in Stripe. Try again whenever you're ready.",
  invalid: "We couldn't verify that install. Start it again from the button below.",
  already_linked: "That Stripe account is already connected to another DeclineKit account.",
  test_mode: "That was a test-mode install. Install DeclineKit in live mode to recover real payments.",
  unavailable: "One-click install isn't available yet. Use a restricted key below.",
};

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ install?: string }> }) {
  const account = await requireAccount();
  const { install } = await searchParams;

  if (!isConnected(account)) {
    const keyForm = (
      <>
        <ol className="steps">
          <li>
            <a href={KEY_URL} target="_blank" rel="noreferrer" className="btn btn-primary">Create the DeclineKit key in Stripe</a>
            <br />The name and permissions are already filled in. Check they match this list, with everything else as None:
            <table className="perm-table">
              <tbody>{PERMISSIONS.map(([r, p]) => <tr key={r}><td>{r}</td><td>{p}</td></tr>)}</tbody>
            </table>
          </li>
          <li>Click Create key, copy it, and paste it here.</li>
        </ol>
        <ConnectForm />
        <p className="fine">Your key is encrypted at rest with AES-256. Disconnect any time in Settings, or delete the key in Stripe. Never paste your secret key (sk_live_): we only accept restricted keys.</p>
      </>
    );
    return (
      <section className="onboarding">
        <h1>Connect your Stripe account</h1>
        {install && INSTALL_MESSAGES[install] && <p className="error">{INSTALL_MESSAGES[install]}</p>}
        {appInstallAvailable() ? (
          <>
            <p className="lede">
              Install the DeclineKit app from Stripe. You&rsquo;ll see exactly what it can access on Stripe&rsquo;s own
              approval screen, and there&rsquo;s no key to copy. It can&rsquo;t move money anywhere or touch your payouts.
            </p>
            <a href="/api/stripe-app/install" className="btn btn-primary btn-lg" data-fast-goal="app_install_click">Install from Stripe</a>
            <details className="key-fallback">
              <summary>Or connect with a restricted key instead</summary>
              {keyForm}
            </details>
          </>
        ) : (
          <>
            <p className="lede">
              DeclineKit needs a restricted key so it can see failed invoices, email your customers, and retry the
              charge when they add a new card. It can&rsquo;t move money anywhere or touch your payouts.
            </p>
            {keyForm}
          </>
        )}
      </section>
    );
  }

  const [stats] = await sql`
    SELECT
      COALESCE(SUM(amount_cents) FILTER (WHERE status = 'recovered' AND recovered_at > now() - interval '30 days'), 0) AS recovered_30,
      COALESCE(SUM(amount_cents) FILTER (WHERE status = 'recovered'), 0) AS recovered_all,
      COALESCE(SUM(amount_cents) FILTER (WHERE status = 'open'), 0) AS open_cents,
      COUNT(*) FILTER (WHERE status = 'open') AS open_count,
      COALESCE(MAX(currency), 'usd') AS currency
    FROM failed_invoices WHERE account_id = ${account.id}`;
  const rows = (await sql`SELECT * FROM failed_invoices WHERE account_id = ${account.id}
                          ORDER BY failed_at DESC LIMIT 100`) as Row[];
  const cur = stats.currency as string;
  const brand = account.brand_name ?? account.stripe_account_name ?? "Your product";
  const [expiring] = await sql`
    SELECT COUNT(*) FILTER (WHERE sent_at > now() - interval '30 days') AS sent_30,
           COUNT(*) FILTER (WHERE card_updated_at IS NOT NULL) AS updated_all
    FROM expiring_reminders WHERE account_id = ${account.id}`;
  const expiringPreview = expiringCopy({
    brand, customerName: "Sam Customer", cardBrand: "visa", last4: "4242",
    expires: new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth() + 1, 0)),
    renewsOn: new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth() + 1, 12)),
    link: "https://declinekit.com/c/…",
  });
  const preview = dunningCopy({ step: 0, brand, customerName: "Sam Customer", amountCents: 4900, currency: cur, link: "https://declinekit.com/u/…" });

  return (
    <>
      <section className={account.emails_enabled ? "status status-on" : "status status-off"}>
        <div>
          <h1>{account.emails_enabled ? "Recovery emails are on" : "Recovery emails are off"}</h1>
          <p>
            {account.emails_enabled
              ? "When a card is declined, the customer gets up to four emails over 12 days with a link to update their card. Customers whose card expires before their next renewal get a heads-up first."
              : `Check the first email below, then turn recovery on. ${Number(stats.open_count)} failed invoice${Number(stats.open_count) === 1 ? " is" : "s are"} waiting.`}
          </p>
        </div>
        <form action={setEmailsEnabled}>
          {!account.emails_enabled && <input type="hidden" name="enabled" value="on" />}
          <button className={account.emails_enabled ? "btn" : "btn btn-primary"}>
            {account.emails_enabled ? "Pause emails" : "Turn on recovery emails"}
          </button>
        </form>
        <p className="status-note">
          So customers don&rsquo;t get two emails, turn off &ldquo;Send emails when card payments fail&rdquo; in{" "}
          <a href="https://dashboard.stripe.com/revenue_recovery/emails" target="_blank" rel="noreferrer">Stripe&rsquo;s revenue recovery settings</a>.
          Keep Smart Retries on.
        </p>
      </section>

      <section className="figures">
        <div><span className="figure recovered">{money(stats.recovered_30 as number, cur)}</span><span>recovered in the last 30 days</span></div>
        <div><span className="figure">{money(stats.recovered_all as number, cur)}</span><span>recovered since you connected</span></div>
        <div><span className="figure failed">{money(stats.open_cents as number, cur)}</span><span>still failing across {String(stats.open_count)} invoice{Number(stats.open_count) === 1 ? "" : "s"}</span></div>
      </section>

      <section>
        <h2>Failed payments</h2>
        {rows.length === 0 ? (
          <p className="empty">No failed payments yet. When a subscription charge is declined it shows up here within seconds.</p>
        ) : (
          <div className="table-wrap">
            <table className="ledger">
              <thead><tr><th>Customer</th><th>Amount</th><th>Failed</th><th>Emails</th><th>Status</th></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td>{r.customer_name ?? r.customer_email ?? "Unknown"}{r.customer_name && <small>{r.customer_email}</small>}</td>
                    <td className="num">{money(r.amount_cents, r.currency)}</td>
                    <td>{new Date(r.failed_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</td>
                    <td className="num">{r.emails_sent} of 4</td>
                    <td><span className={`pill pill-${r.status}`}>{r.status === "recovered" ? (r.recovered_via === "card_update" ? "Recovered: new card" : "Recovered: retry") : r.status === "open" ? (r.customer_email ? "In recovery" : "No email on file") : "Lost"}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2>What your customers receive</h2>
        <p className="fine">
          Sent from &ldquo;{account.from_name ?? brand}&rdquo; at {STEP_OFFSET_HOURS.map((h) => (h < 24 ? "1 hour" : `day ${h / 24}`)).join(", ")} after the decline.
          Replies go to {account.reply_to ?? account.email}. Change these in Settings.
        </p>
        <article className="email-preview">
          <p className="email-subject">{preview.subject}</p>
          <pre>{preview.body}</pre>
        </article>
      </section>

      <section>
        <h2>Card expiry reminders</h2>
        <p className="fine">
          Once a day, DeclineKit looks for active subscriptions whose card expires before the next renewal and sends
          one reminder per card, so the payment never fails in the first place.{" "}
          {String(expiring.sent_30)} sent in the last 30 days, {String(expiring.updated_all)} card{Number(expiring.updated_all) === 1 ? "" : "s"} updated.
        </p>
        <article className="email-preview">
          <p className="email-subject">{expiringPreview.subject}</p>
          <pre>{expiringPreview.body}</pre>
        </article>
      </section>
    </>
  );
}
