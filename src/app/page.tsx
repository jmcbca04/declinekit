import Link from "next/link";
import { CLOUD } from "@/lib/config";
import { redirect } from "next/navigation";
import { PLANS, type PlanId } from "@/lib/plans";
import { SiteFooter, SiteHeader } from "./site-chrome";

const TIMELINE: { at: string; what: string; tone?: "failed" | "recovered" }[] = [
  { at: "Oct 2, 9:14 am", what: "Charge declined: expired_card", tone: "failed" },
  { at: "Oct 2, 10:14 am", what: "Email sent: “Your Fieldnote payment didn’t go through”" },
  { at: "Oct 5, 9:14 am", what: "Email sent: “Quick reminder: update your card”" },
  { at: "Oct 5, 11:02 am", what: "Customer added a new card from the email link" },
  { at: "Oct 5, 11:02 am", what: "Invoice paid: $49.00", tone: "recovered" },
];

const STEPS = [
  ["Install from the Stripe App Marketplace", "One click on Stripe’s own approval screen. DeclineKit can read invoices and retry charges. It can’t issue refunds or touch payouts."],
  ["A card gets declined", "Stripe tells us within seconds. We wait an hour so Stripe’s own retry gets a chance first."],
  ["Your customer hears from you", "Up to four short plain-text emails over 12 days, sent in your product’s name. Replies land in your inbox."],
  ["They fix it in one click", "The link opens a Stripe-hosted card form. The moment they save, we retry the invoice and their subscription carries on."],
];

const VERSUS: [string, string, string][] = [
  ["Before a card expires", "An expiring-card notice, if you turn it on", "A heads-up in your name only when the card dies before the next renewal"],
  ["What arrives", "A templated billing notice after each failed attempt", "Up to four short plain-text emails over 12 days, each a little more direct"],
  ["How it reads", "A receipt with your logo and colors", "A note from you, in your product’s name, with replies going to your inbox"],
  ["What you see", "Recovery totals in the Stripe Dashboard", "Every failed invoice, every email sent, and which customers came back"],
];

const PERMISSIONS: [string, string, string][] = [
  ["Invoices", "Write", "Find failed invoices, and retry that one invoice after your customer adds a new card"],
  ["Customers", "Write", "Read the customer’s name and email, and save their new card as the default"],
  ["Subscriptions", "Write", "Point the subscription at the new card"],
  ["Checkout Sessions", "Write", "Create the Stripe-hosted page where the customer enters their new card"],
  ["SetupIntents, PaymentMethods", "Read", "Confirm the new card was saved"],
  ["Webhook Endpoints", "Write", "Add one webhook so Stripe tells us when a payment fails, and remove it when you disconnect"],
];

const CANNOT = [
  "Issue refunds, or create new charges or subscriptions",
  "Touch your balance, payouts or bank account",
  "Change your prices, products or account settings",
  "See full card numbers. Stripe never shares them",
];

const FAQ = [
  ["Doesn’t Stripe already send failed-payment emails?", "Yes, and it’s a sensible default. Stripe sends a templated notice after each failed attempt, styled with your logo and colors. DeclineKit replaces that with a short sequence that reads like a personal note and escalates over 12 days, plus a heads-up before a card expires. When you switch DeclineKit on, turn Stripe’s failed-payment emails off so customers don’t get both."],
  ["Couldn’t I build this with Stripe Automations?", "You could. Automations lets you design your own recovery workflow if you want to write the emails, set the timing, and maintain it yourself. DeclineKit is the ready-made version: install it from the Stripe App Marketplace, preview the emails, switch it on."],
  ["Does this replace Stripe’s Smart Retries?", "No, it works alongside them. Retries win back cards that fail temporarily. An expired or replaced card won’t succeed on retry, and that’s the money DeclineKit goes after by asking the customer for a new card."],
  ["Is it safe to connect DeclineKit to Stripe?", "DeclineKit is a Stripe App reviewed and approved by Stripe. It asks for only the permissions listed above, and Stripe shows them to you before you install. DeclineKit can’t refund, transfer, or change payouts. Uninstall it in Stripe and access ends immediately. Prefer a restricted API key instead? That works too, and we encrypt it with AES-256."],
  ["Who do the emails come from?", "Your product name and sender name, with replies going to whatever address you choose. Emails are plain text so they read like a note from you, not a marketing blast."],
  ["Will you email customers before I’m ready?", "No. Emails stay off until you’ve previewed them and switched recovery on."],
  ["What does it cost?", "Nothing until DeclineKit has recovered your first $100, or for 60 days, whichever comes first. Then $29, $79 or $149 a month depending on your MRR. If you don’t pick a plan, recovery emails pause. Nothing is ever charged automatically, and no card is needed to start."],
  ["What counts as recovered?", "Only payments your customers make through DeclineKit’s card-update link. Invoices that Stripe’s own retries collect don’t count toward your $100."],
];

export default function Home() {
  // Self-hosted installs have no marketing site: the app is the home page.
  if (!CLOUD) redirect("/app");
  return (
    <>
      <SiteHeader />
      <main>
        <section className="hero">
          <div className="hero-copy">
            <h1>Get paid for the subscriptions your customers meant to keep.</h1>
            <p className="lede">
              When a card is declined, DeclineKit emails your customer a link to update it and retries the charge
              the moment they do. Install it from the Stripe App Marketplace in one click.
            </p>
            <div className="cta-row">
              <Link href="/login" className="btn btn-primary btn-lg">Start free</Link>
              <Link href="/audit" className="btn btn-lg">See what failed cards cost you</Link>
            </div>
            <p className="fine">
              Free until we recover your first $100. No card required.{" "}
              <a href="https://marketplace.stripe.com/apps/declinekit">Now on the Stripe App Marketplace &rarr;</a>
            </p>
          </div>
          <figure className="receipt" aria-label="Example: how one failed invoice gets recovered">
            <figcaption>
              <span className="receipt-title">Fieldnote Pro, monthly</span>
              <span className="receipt-amount">$49.00</span>
            </figcaption>
            <ol>
              {TIMELINE.map((t, i) => (
                <li key={i} className={t.tone}>
                  <time>{t.at}</time>
                  <span>{t.what}</span>
                </li>
              ))}
            </ol>
          </figure>
        </section>

        <section className="problem">
          <p className="problem-big">
            A declined card cancels a subscription just as surely as a customer clicking &ldquo;cancel&rdquo;.
          </p>
          <p>
            Industry studies put involuntary churn at 20&ndash;40% of all SaaS churn. These are customers who
            still want your product. Their card expired, they got a new number, or their bank flagged the charge.
            Stripe&rsquo;s built-in failed-payment notice is a templated billing email that&rsquo;s easy to ignore, and
            most founders never notice until the MRR chart dips.
          </p>
        </section>

        <section className="versus">
          <h2>Stripe&rsquo;s built-in email vs. DeclineKit</h2>
          <p className="lede">
            Keep Stripe&rsquo;s Smart Retries and automatic card updates on. They win back temporary declines. DeclineKit
            replaces the part that needs a human: getting the customer to enter a new card.
          </p>
          <div className="table-wrap">
            <table className="ledger versus-table">
              <thead><tr><th></th><th>Stripe&rsquo;s failed-payment email</th><th>DeclineKit</th></tr></thead>
              <tbody>
                {VERSUS.map(([row, stripe, dk]) => (
                  <tr key={row}><th scope="row">{row}</th><td data-label="Stripe">{stripe}</td><td data-label="DeclineKit">{dk}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="how">
          <h2>How a failed payment gets recovered</h2>
          <ol className="how-steps">
            {STEPS.map(([title, body]) => (
              <li key={title}><h3>{title}</h3><p>{body}</p></li>
            ))}
          </ol>
        </section>

        <section className="versus" id="permissions">
          <h2>What DeclineKit can do in your Stripe account</h2>
          <p className="lede">
            The only charge DeclineKit ever makes is retrying an invoice your customer already owed, after they add a new
            card. Here is every permission the key asks for, and what it&rsquo;s used for.
          </p>
          <div className="table-wrap">
            <table className="ledger versus-table">
              <thead><tr><th>Stripe permission</th><th>Access</th><th>What DeclineKit uses it for</th></tr></thead>
              <tbody>
                {PERMISSIONS.map(([area, access, use]) => (
                  <tr key={area}><th scope="row">{area}</th><td data-label="Access">{access}</td><td data-label="Used for">{use}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <h3>What it can&rsquo;t do</h3>
          <ul>
            {CANNOT.map((c) => <li key={c}>{c}</li>)}
          </ul>
          <p className="fine">
            Stripe&rsquo;s permissions aren&rsquo;t fine-grained enough to say &ldquo;only update the default card&rdquo;, so
            Write access to Customers technically allows editing other customer fields. DeclineKit&rsquo;s code only does the
            actions above. The free audit uses a separate key with read-only access to Invoices, and never stores it.
          </p>
        </section>

        <section className="pricing" id="pricing">
          <h2>One recovered customer usually pays for the month</h2>
          <p className="lede">Free until we recover your first $100, or for 60 days. Then flat pricing by your MRR, with no cut of what we recover. Every plan includes everything.</p>
          <div className="plans">
            {(Object.keys(PLANS) as PlanId[]).map((id) => (
              <div key={id} className={id === "growth" ? "plan plan-featured" : "plan"}>
                <h3>{PLANS[id].name}</h3>
                <p className="plan-price">${PLANS[id].price}<span>/month</span></p>
                <p>{PLANS[id].limit}</p>
                <Link href="/login" className={id === "growth" ? "btn btn-primary" : "btn"}>Start free</Link>
              </div>
            ))}
          </div>
          <p className="fine">Over $250k MRR? <a href="https://www.quickping.dev/to/declinekit">Contact support</a>.</p>
        </section>

        <section className="faq">
          <h2>Questions</h2>
          <dl>
            {FAQ.map(([q, a]) => (
              <div key={q}><dt>{q}</dt><dd>{a}</dd></div>
            ))}
          </dl>
        </section>

        <section className="closing">
          <h2>Find out what declined cards cost you last quarter.</h2>
          <p>The free audit reads your last 90 days of Stripe invoices and shows the total. It takes about 30 seconds.</p>
          <Link href="/audit" className="btn btn-primary btn-lg">Run the free audit</Link>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
