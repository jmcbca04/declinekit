import Link from "next/link";
import { DECLINE_CODES, type DeclineCode } from "@/lib/decline-codes";
import { SiteFooter, SiteHeader } from "../site-chrome";
import { Faq } from "../faq";

export const metadata = {
  title: "Stripe decline codes: what they mean and what to do | DeclineKit",
  description:
    "Every common Stripe decline code for subscription businesses: what it means, whether Smart Retries can fix it, and what to tell your customer when they can't.",
  alternates: { canonical: "/decline-codes" },
};

const GROUPS: { retry: DeclineCode["retry"]; title: string; intro: string }[] = [
  {
    retry: "yes",
    title: "Temporary declines: retries usually fix these",
    intro: "The card still works; the bank just said no this time. Stripe's Smart Retries charge it again over the following days, and most of these clear without the customer doing anything.",
  },
  {
    retry: "sometimes",
    title: "Unclear declines: retry, and ask the customer",
    intro: "The bank didn't say why. A retry or two can work, but these often need the customer to call their bank or use another card, so email them in parallel.",
  },
  {
    retry: "no",
    title: "Dead cards: only a new card fixes these",
    intro: "Expired, replaced, lost, stolen or closed. Retrying the same card won't work no matter how often you try. The only way back is asking the customer for a new card.",
  },
];

export default function DeclineCodes() {
  return (
    <>
      <SiteHeader />
      <main className="prose wide">
        <h1>Stripe decline codes, explained for businesses</h1>
        <p className="lede">
          When a subscription renewal fails, Stripe records a decline code from the customer&rsquo;s bank. That code
          tells you the one thing that matters: will retrying the same card work, or do you need the customer to enter
          a new one?
        </p>
        <p className="fine">
          Is your own card being declined? This page is for businesses that charge cards. Your bank is the only one who
          can tell you why it declined your payment, so call the number on the back of your card.
        </p>

        <h2>Where to find the decline code in Stripe</h2>
        <p>
          In the Stripe Dashboard, open <strong>Payments</strong> and select the failed payment. The decline code is
          shown in the payment&rsquo;s details, next to the failure message. In the API it&rsquo;s{" "}
          <code>last_payment_error.decline_code</code> on the PaymentIntent (the charge&rsquo;s <code>failure_code</code> gives the broader category).
          Stripe&rsquo;s own <code>generic_decline</code> and <code>card_declined</code> mean the bank gave no specific reason.
        </p>

        {GROUPS.map((g) => (
          <section key={g.retry}>
            <h2>{g.title}</h2>
            <p>{g.intro}</p>
            <div className="table-wrap">
              <table className="ledger codes">
                <thead><tr><th>Code</th><th>Meaning</th></tr></thead>
                <tbody>
                  {DECLINE_CODES.filter((c) => c.retry === g.retry).map((c) => (
                    <tr key={c.code}>
                      <td><Link href={`/decline-codes/${c.code}`} className="mono">{c.code}</Link></td>
                      <td>{c.meaning}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}

        <h2>What to do with each kind of decline</h2>
        <ol>
          <li><strong>Turn on Smart Retries</strong> (Stripe Dashboard &rarr; Revenue recovery &rarr; Retries). They handle the temporary declines for free.</li>
          <li><strong>Email the customer for everything else</strong>, with one link straight to a card form. See our <Link href="/dunning-email-templates">free dunning email templates</Link>.</li>
          <li><strong>Never tell a customer their card was flagged as fraudulent or stolen</strong>, even when the code says so. Present it as a generic decline and ask for another card.</li>
          <li><strong>Warn customers before a card expires</strong>, so <Link href="/decline-codes/expired_card">expired_card</Link> never happens in the first place.</li>
        </ol>
        <p>
          More on how the two approaches split the work:{" "}
          <Link href="/guides/stripe-smart-retries-vs-dunning-emails">Smart Retries vs. dunning emails</Link> and{" "}
          <Link href="/guides/stripe-failed-payments">what to do about Stripe failed payments</Link>.
        </p>

        <Faq
          items={[
            {
              q: "What is the most common Stripe decline code?",
              a: "For subscription renewals, generic declines (do_not_honor, generic_decline, card_declined) and insufficient_funds are the most common, followed by expired and replaced cards.",
            },
            {
              q: "Can I retry a payment that was declined?",
              a: "Yes for temporary declines like insufficient_funds or processing_error: Smart Retries do this automatically. No for expired, lost, stolen or closed cards: retrying the same card will keep failing, and card networks discourage repeated retries on cards that will never work.",
            },
            {
              q: "Why does Stripe say generic_decline?",
              a: "The customer's bank declined the charge without giving Stripe a reason. Only the bank knows why. Retry once or twice and ask the customer to contact their bank or use a different card.",
            },
            {
              q: "What should I tell a customer whose payment failed?",
              a: "That the payment didn't go through, with a single link to update their card. Keep it short and assume an honest mistake, because it almost always is one.",
            },
          ]}
        />

        <aside className="callout">
          <h2>Let DeclineKit handle the dead cards</h2>
          <p>
            DeclineKit works alongside Smart Retries. When a renewal fails, it emails your customer in your business&rsquo;s
            name with a link to a Stripe-hosted card form, then retries the invoice the moment they add a new card.
            Free until it recovers your first $100, then from $29/month.
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
