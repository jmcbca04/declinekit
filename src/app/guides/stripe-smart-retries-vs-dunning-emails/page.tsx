import Link from "next/link";
import { SiteFooter, SiteHeader } from "../../site-chrome";

export const metadata = {
  title: "Stripe Smart Retries vs. dunning emails: what each one recovers | DeclineKit",
  description:
    "Smart Retries win back temporary declines. Dunning emails win back expired and replaced cards. How they differ, which decline codes each fixes, and the setup that recovers the most.",
  alternates: { canonical: "/guides/stripe-smart-retries-vs-dunning-emails" },
};

const ROWS: [string, string, string][] = [
  ["What it does", "Re-attempts the charge on the card already on file", "Asks the customer to enter a new or working card"],
  ["Needs the customer?", "No", "Yes, one click to a card form"],
  ["Fixes", "Temporary declines: insufficient funds, processing errors, bank timeouts", "Dead cards: expired, replaced, lost or stolen, closed accounts"],
  ["Can’t fix", "A card that will never work again", "Customers who never open the email"],
  ["In Stripe", "Built in. Turn on in Revenue recovery → Retries", "A templated notice after each failed attempt, or your own sequence"],
];

export default function SmartRetriesVsDunning() {
  return (
    <>
      <SiteHeader />
      <main className="prose">
        <h1>Stripe Smart Retries vs. dunning emails</h1>
        <p className="lede">
          They solve different halves of the same problem. Smart Retries win back payments that fail for a temporary
          reason. Dunning emails win back payments that will never succeed on the card you have. You want both.
        </p>

        <table className="ledger">
          <thead><tr><th></th><th>Smart Retries</th><th>Dunning emails</th></tr></thead>
          <tbody>{ROWS.map(([k, a, b]) => <tr key={k}><th scope="row">{k}</th><td>{a}</td><td>{b}</td></tr>)}</tbody>
        </table>

        <h2>How Smart Retries work</h2>
        <p>
          When a subscription payment fails, Stripe re-attempts it at times its models predict are most likely to
          succeed, using signals from across its network. Stripe&rsquo;s recommended default is 8 attempts within 2
          weeks, and you can choose a window from 1 week to 2 months. It costs nothing to turn on and needs nothing
          from the customer.
        </p>
        <p>
          That makes retries ideal for temporary declines: <Link href="/decline-codes/insufficient_funds">insufficient funds</Link>,{" "}
          <Link href="/decline-codes/processing_error">processing errors</Link>,{" "}
          <Link href="/decline-codes/issuer_not_available">an unreachable bank</Link>. Wait a few days and the same card goes through.
        </p>

        <h2>Where retries stop working</h2>
        <p>
          A retry charges the same card again. If that card has <Link href="/decline-codes/expired_card">expired</Link>, been{" "}
          <Link href="/decline-codes/incorrect_number">replaced</Link>, or reported{" "}
          <Link href="/decline-codes/lost_card">lost</Link>, no number of retries will work. Stripe&rsquo;s automatic card
          updater catches some of these when card networks share the new details, but not every bank participates.
          The rest only come back if someone asks the customer for a new card. That&rsquo;s the job of a dunning email.
        </p>

        <h2>Stripe&rsquo;s built-in emails vs. a dunning sequence</h2>
        <p>
          Stripe can email customers automatically after each failed payment, styled with your logo and colors, with
          a link to a Stripe-hosted page to update their card. It&rsquo;s a good baseline and takes one toggle. A
          dedicated sequence differs in tone and timing: a few plain-text notes that read like they came from you,
          escalate gently over about two weeks, and send replies to a real inbox. Use one or the other, not both, or
          customers get two emails about the same payment.
        </p>

        <p>
          New to this? Start with <Link href="/guides/stripe-failed-payments">why Stripe payments fail and how to recover them</Link>.
        </p>

        <h2>The setup that recovers the most</h2>
        <ol>
          <li><strong>Turn on Smart Retries</strong> in Stripe under Revenue recovery &rarr; Retries.</li>
          <li><strong>Leave automatic card updates on.</strong> They&rsquo;re on by default and free.</li>
          <li><strong>Send a dunning sequence</strong> that links straight to a card form. Use Stripe&rsquo;s emails or a sequence like our <Link href="/dunning-email-templates">free templates</Link>.</li>
          <li><strong>Warn customers before a card expires</strong>, so the payment never fails in the first place.</li>
          <li><strong>Stop emailing the moment the invoice is paid.</strong></li>
        </ol>

        <aside className="callout">
          <h2>Steps 3, 4 and 5, done for you</h2>
          <p>
            DeclineKit works alongside Smart Retries. It emails customers in your name when a payment fails, warns them
            before a card expires, and retries the charge the moment they add a new card. Free until it recovers your first $100, then from $29/month.
          </p>
          <div className="cta-row">
            <Link href="/audit" className="btn btn-primary">See what failed payments cost you</Link>
            <Link href="/login" className="btn">Start free</Link>
          </div>
        </aside>
      </main>
      <SiteFooter />
    </>
  );
}
