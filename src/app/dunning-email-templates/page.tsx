import Link from "next/link";
import { dunningCopy, expiringCopy, STEP_OFFSET_HOURS } from "@/lib/email";
import { SiteFooter, SiteHeader } from "../site-chrome";
import { CopyButton } from "../copy-button";
import { Faq } from "../faq";

export const metadata = {
  title: "Dunning email templates for SaaS (free, copy and paste) | DeclineKit",
  description:
    "Free failed-payment (dunning) email templates for SaaS: four emails plus a card-expiry warning, with subject lines, send timing, and what to avoid.",
  alternates: { canonical: "/dunning-email-templates" },
};

const WHEN = STEP_OFFSET_HOURS.map((h) => (h < 24 ? "1 hour after the decline" : `Day ${h / 24}`));
const PURPOSE = [
  "Calm and factual. Most customers fix it right here.",
  "A short nudge for people who saw the first one and forgot.",
  "Names the consequence: the subscription will be cancelled.",
  "The last chance. Short, polite, final.",
];

export default function DunningTemplates() {
  const emails = [0, 1, 2, 3].map((step) =>
    dunningCopy({ step, brand: "Acme", customerName: "Sam", amountCents: 4900, currency: "usd", link: "https://acme.com/billing" }),
  );
  const expiring = expiringCopy({
    brand: "Acme", customerName: "Sam", cardBrand: "visa", last4: "4242",
    expires: new Date(Date.UTC(2026, 10, 1)), renewsOn: new Date(Date.UTC(2026, 11, 3)), link: "https://acme.com/billing",
  });
  return (
    <>
      <SiteHeader />
      <main className="prose">
        <h1>Dunning email templates for SaaS</h1>
        <p className="lede">
          Four emails to send when a customer&rsquo;s subscription payment fails, in the order and timing that
          recovers the most revenue. Copy them, swap in your product name, and send them from a real person.
        </p>

        <h2>The sequence at a glance</h2>
        <table className="ledger">
          <thead><tr><th>Email</th><th>When</th><th>Job</th></tr></thead>
          <tbody>
            {emails.map((e, i) => (
              <tr key={i}><td>{i + 1}. {e.subject}</td><td>{WHEN[i]}</td><td>{PURPOSE[i]}</td></tr>
            ))}
          </tbody>
        </table>

        {emails.map((e, i) => (
          <section key={i} className="template">
            <div className="template-head">
              <h2>Email {i + 1}: {WHEN[i].toLowerCase()}</h2>
              <CopyButton text={`Subject: ${e.subject}\n\n${e.body}`} />
            </div>
            <article className="email-preview">
              <p className="email-subject">{e.subject}</p>
              <pre>{e.body}</pre>
            </article>
          </section>
        ))}

        <section className="template">
          <div className="template-head">
            <h2>Bonus: before the card expires</h2>
            <CopyButton text={`Subject: ${expiring.subject}\n\n${expiring.body}`} />
          </div>
          <p>
            The cheapest failed payment is the one that never happens. Send this once, a few weeks before a card on
            file expires, when the next renewal falls after the expiry date.
          </p>
          <article className="email-preview">
            <p className="email-subject">{expiring.subject}</p>
            <pre>{expiring.body}</pre>
          </article>
        </section>

        <h2>Subject lines that get opened</h2>
        <p>Plain and specific beats clever. Use your product name, and say what happened.</p>
        <ul>
          <li>Your payment for Acme didn&rsquo;t go through</li>
          <li>Quick fix needed for your Acme subscription</li>
          <li>Your Acme card was declined</li>
          <li>Acme: your subscription will be cancelled on Friday</li>
          <li>Last reminder about your Acme payment</li>
        </ul>
        <p>Avoid &ldquo;URGENT&rdquo;, &ldquo;Action required!!&rdquo; and all-caps. They look like phishing and land in spam.</p>

        <h2>What makes these work</h2>
        <ul>
          <li><strong>Plain text, from a person.</strong> A styled billing template reads like a receipt and gets skimmed. A short note from a named person gets opened and answered.</li>
          <li><strong>Replies go to a real inbox.</strong> Customers often reply &ldquo;I switched banks&rdquo; or &ldquo;can I pay another way?&rdquo; Those replies are saved subscriptions.</li>
          <li><strong>One link, straight to the card form.</strong> No login, no dashboard to dig through.</li>
          <li><strong>Escalate slowly.</strong> The first email assumes an innocent mistake, because it almost always is one.</li>
          <li><strong>Never say &ldquo;fraud&rdquo; or &ldquo;stolen&rdquo;.</strong> Even when the decline code says so, present it as a generic decline. See <Link href="/decline-codes">what each Stripe decline code means</Link>.</li>
          <li><strong>Stop the moment they pay.</strong> Check the invoice status right before each send so nobody gets chased for money they already paid.</li>
        </ul>

        <Faq
          items={[
            { q: "What is a dunning email?", a: "An email sent when a customer's subscription payment fails, asking them to update their card so the payment can go through. The name comes from the old word for demanding payment of a debt." },
            { q: "How many dunning emails should I send?", a: "Three or four over about two weeks works for most subscription businesses. Fewer and you miss people who were busy; more and it starts to feel like harassment." },
            { q: "When should the first dunning email go out?", a: "Within a few hours of the failed payment. Customers are most likely to fix it while they still remember signing up. If you also use Stripe's Smart Retries, waiting about an hour gives the first retry a chance." },
            { q: "Should dunning emails be plain text or HTML?", a: "Plain text from a named person tends to get opened and answered. A designed template reads like a receipt and gets skimmed or filtered." },
            { q: "Can Stripe send dunning emails for me?", a: "Yes. Stripe can email customers after a failed payment with a link to update their card. It's a good baseline. A custom sequence lets you control the tone and timing and send replies to a real inbox. Use one or the other, not both." },
          ]}
        />

        <aside className="callout">
          <h2>Or let DeclineKit send them for you</h2>
          <p>
            DeclineKit sends this exact sequence in your product&rsquo;s name whenever a Stripe subscription payment
            fails, links customers to a card update page, and retries the charge the moment they save a new card.
            It stops automatically when the invoice is paid. Free until it recovers your first $100, then from $29/month.
          </p>
          <div className="cta-row">
            <Link href="/login" className="btn btn-primary">Start free</Link>
            <Link href="/audit" className="btn">See what failed payments cost you</Link>
          </div>
        </aside>
      </main>
      <SiteFooter />
    </>
  );
}
