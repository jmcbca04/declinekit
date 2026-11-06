import Link from "next/link";
import { SiteFooter, SiteHeader } from "../../site-chrome";
import { Faq } from "../../faq";

export const metadata = {
  title: "Stripe failed payments: why they happen and how to recover them | DeclineKit",
  description:
    "Why Stripe subscription payments fail, what Stripe already does about it, where to find failed payments in your Dashboard, and how to recover the ones retries can't fix.",
  alternates: { canonical: "/guides/stripe-failed-payments" },
};

const AUTOMATIC: [string, string, string][] = [
  ["Smart Retries", "Re-charges the same card at times Stripe predicts will work", "Revenue recovery → Retries"],
  ["Card account updater", "Swaps in new card details when the bank shares them with the card network", "On by default"],
  ["Failed payment emails", "Emails the customer a link to a Stripe-hosted page to update their card", "Revenue recovery → Emails"],
  ["Authentication links", "Emails a link when a bank requires the customer to confirm the payment (3D Secure)", "Revenue recovery → Emails"],
  ["What happens after the last retry", "Cancels the subscription, marks it unpaid, or leaves it past due", "Revenue recovery → Retries"],
];

export default function StripeFailedPayments() {
  return (
    <>
      <SiteHeader />
      <main className="prose">
        <h1>Stripe failed payments: why they happen and how to get the money back</h1>
        <p className="lede">
          Every subscription business on Stripe has failed renewals. Most aren&rsquo;t customers trying to leave: their
          card expired, their bank flagged a charge, or the account was briefly short. Stripe recovers some of these on
          its own. This guide covers what it does, where to look, and how to get back the rest.
        </p>

        <h2>Why Stripe payments fail</h2>
        <p>Every failed payment comes back with a <Link href="/decline-codes">decline code</Link> from the customer&rsquo;s bank. They fall into two groups:</p>
        <ul>
          <li>
            <strong>Soft declines</strong>: the card still works, but not right now.{" "}
            <Link href="/decline-codes/insufficient_funds">Insufficient funds</Link>, a{" "}
            <Link href="/decline-codes/processing_error">processing error</Link>, or a bank that{" "}
            <Link href="/decline-codes/issuer_not_available">couldn&rsquo;t be reached</Link>. Trying again in a few days often works.
          </li>
          <li>
            <strong>Hard declines</strong>: the card will never work again.{" "}
            <Link href="/decline-codes/expired_card">Expired</Link>, replaced,{" "}
            <Link href="/decline-codes/lost_card">lost</Link> or <Link href="/decline-codes/stolen_card">stolen</Link>, or a closed account.
            No retry can fix these. Only the customer can, by entering a new card.
          </li>
        </ul>
        <p>
          A third group sits in between: <Link href="/decline-codes/do_not_honor">do_not_honor</Link> and{" "}
          <Link href="/decline-codes/generic_decline">generic_decline</Link>, where the bank declined without saying why.
          Those need both a retry and a word with the customer.
        </p>

        <h2>What Stripe does automatically</h2>
        <p>Stripe Billing has several recovery tools built in. Check they&rsquo;re all on before adding anything else:</p>
        <div className="table-wrap">
          <table className="ledger">
            <thead><tr><th>Feature</th><th>What it does</th><th>Where it lives</th></tr></thead>
            <tbody>{AUTOMATIC.map(([a, b, c]) => <tr key={a}><th scope="row">{a}</th><td>{b}</td><td>{c}</td></tr>)}</tbody>
          </table>
        </div>
        <p>
          While Stripe retries, the subscription is <strong>past due</strong>. When the last retry fails, Stripe does
          whatever you chose in your settings: cancel the subscription, mark it unpaid, or leave it past due. Many
          businesses never look at this setting, so failed customers are cancelled quietly two weeks later.
        </p>

        <h2>How to find failed payments in your Stripe Dashboard</h2>
        <ol>
          <li><strong>Payments</strong>, filtered to <strong>Failed</strong>: every declined charge, with its decline code.</li>
          <li><strong>Billing &rarr; Invoices</strong>, filtered to <strong>Past due</strong>: renewals still being retried. These are the ones you can still save.</li>
          <li><strong>Billing &rarr; Subscriptions</strong>, filtered to <strong>Past due</strong> or <strong>Unpaid</strong>: customers whose access is at risk.</li>
        </ol>
        <p>
          To see the total for the last 90 days without clicking through each invoice, run the{" "}
          <Link href="/audit">free failed payment audit</Link>, or estimate it from your MRR with the{" "}
          <Link href="/failed-payment-calculator">calculator</Link>.
        </p>

        <h2>How to recover the payments retries can&rsquo;t</h2>
        <p>
          Retries handle soft declines. For hard declines, someone has to ask the customer for a new card. That&rsquo;s
          dunning, and it works best when it&rsquo;s:
        </p>
        <ul>
          <li><strong>Fast.</strong> Email within hours of the failure, while the customer still remembers what they signed up for.</li>
          <li><strong>Easy.</strong> One link, straight to a card form. No login, no hunting through account settings.</li>
          <li><strong>Personal.</strong> A short plain-text note from your business, with replies going to a real inbox.</li>
          <li><strong>Persistent but polite.</strong> Three or four emails over about two weeks. Here are <Link href="/dunning-email-templates">four free templates</Link>.</li>
          <li><strong>Followed by an immediate retry.</strong> When the customer saves a new card, charge the failed invoice right away instead of waiting for the next scheduled retry.</li>
        </ul>
        <p>
          Stripe&rsquo;s built-in failed payment emails cover the basics. A custom sequence gives you control over tone
          and timing. Use one or the other, not both, or customers get two emails about the same payment. More on the
          trade-offs in <Link href="/guides/stripe-smart-retries-vs-dunning-emails">Smart Retries vs. dunning emails</Link>.
        </p>

        <h2>Prevent the next one</h2>
        <p>
          Expired cards are the most predictable failure there is: the expiry date is on file. Email customers a few
          weeks before their card expires, when the next renewal falls after that date, and most of them update it
          before the payment ever fails.
        </p>

        <h2>A checklist</h2>
        <ol>
          <li>Smart Retries on, with a retry window of about two weeks.</li>
          <li>Decide what happens after the last retry, and check it isn&rsquo;t silently cancelling customers you could still win back.</li>
          <li>Failed payment emails on: Stripe&rsquo;s, or your own sequence.</li>
          <li>One-click card update link in every email.</li>
          <li>Retry the invoice as soon as a new card is saved.</li>
          <li>Warn customers before their card expires.</li>
        </ol>

        <Faq
          items={[
            { q: "Why do Stripe subscription payments fail?", a: "The customer's bank declined the charge. The most common reasons are expired or replaced cards, insufficient funds, and generic declines where the bank gives no reason. Stripe records the bank's decline code on each failed payment." },
            { q: "Does Stripe retry failed payments automatically?", a: "Yes, if Smart Retries is turned on in your Stripe Dashboard under Revenue recovery. Stripe's recommended default is 8 attempts within 2 weeks." },
            { q: "What happens to a subscription when the payment fails?", a: "It becomes past due while Stripe retries. After the last retry, Stripe cancels it, marks it unpaid, or leaves it past due, depending on your settings." },
            { q: "How do I get a customer to update their card in Stripe?", a: "Send them a link to a Stripe-hosted page where they can enter a new card: Stripe's failed payment emails include one, or you can create one with the customer portal or a Checkout session in setup mode. Then retry the failed invoice." },
            { q: "Can I stop payments from failing in the first place?", a: "Partly. Keep the card account updater on, and email customers before their card expires. Some declines, like insufficient funds, can't be prevented, only retried." },
          ]}
        />

        <aside className="callout">
          <h2>DeclineKit does steps 3 to 6 for you</h2>
          <p>
            When a Stripe renewal fails, DeclineKit emails your customer in your business&rsquo;s name with a link to a
            Stripe-hosted card form, retries the invoice the moment they add a new card, and warns customers before a card
            expires. It works alongside Smart Retries. Free until it recovers your first $100, then from $29/month.
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
