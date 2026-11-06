import Link from "next/link";
import { restrictedKeyUrl } from "@/lib/stripe";
import { SiteFooter, SiteHeader } from "../site-chrome";
import { AuditForm } from "./audit-form";

export const metadata = {
  title: "Free Stripe failed payment audit — DeclineKit",
  description: "See how much subscription revenue you lost to declined cards in the last 90 days. Free, read-only, about 30 seconds.",
};

export default function Audit() {
  return (
    <>
      <SiteHeader />
      <main className="audit">
        <div className="audit-intro">
          <h1>How much did declined cards cost you last quarter?</h1>
          <p className="lede">
            Paste a read-only Stripe key and we&rsquo;ll add up every subscription invoice from the last 90 days that
            failed and was never paid. The key is used once for this check and is never stored.
          </p>
          <p className="audit-nokey">
            No key handy? <Link href="/failed-payment-calculator" data-fast-goal="audit_to_calculator">Estimate it from your MRR in 10 seconds</Link>,
            or <Link href="/login" data-fast-goal="audit_to_trial">start free</Link> (free until we recover your first $100) and connect Stripe later.
          </p>
          <ol className="steps">
            <li>
              <a href={restrictedKeyUrl("DeclineKit audit", ["rak_invoice_read"])} target="_blank" rel="noreferrer" data-fast-goal="audit_key_link">Create a read-only key in Stripe</a>.
              It opens with <strong>Invoices: Read</strong> already set and everything else as None.
            </li>
            <li>Click Create key, paste it into the form, then delete it in Stripe afterwards if you like.</li>
          </ol>
          <p className="fine">
            A read-only Invoices key can&rsquo;t charge, refund, email or change anything. It can only list invoices.
          </p>
          <details className="audit-code">
            <summary>Exactly what the audit does with your key</summary>
            <p>
              One read-only call, paged through the last 90 days. The key stays in memory for this request and is never
              written anywhere. We save only the totals, plus your email if you enter one.
            </p>
            <pre>{`const stripe = new Stripe(yourKey);
for await (const invoice of stripe.invoices.list({
  created: { gte: ninetyDaysAgo },
})) {
  // subscription invoices, charged automatically
  // failed = attempted at least once, still open or uncollectible
  // recovered by retries = paid after more than one attempt
}`}</pre>
          </details>
          <figure className="audit-result audit-sample" aria-label="Example audit result">
            <figcaption className="fine">Example result (illustrative, not a real customer)</figcaption>
            <p className="audit-figure failed">$1,860.00</p>
            <p className="audit-caption">
              in subscription payments failed and were never collected over the last 90 days, across 14 invoices and
              11 customers.
            </p>
            <dl className="audit-breakdown">
              <div><dt>Likely recoverable with card-update emails</dt><dd className="recovered">$744.00</dd></div>
              <div><dt>Same rate over a year</dt><dd>$2,976.00</dd></div>
              <div><dt>Already recovered by Stripe&rsquo;s retries</dt><dd>$1,120.00</dd></div>
            </dl>
          </figure>
        </div>
        <AuditForm />
      </main>
      <SiteFooter />
    </>
  );
}
