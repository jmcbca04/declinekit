import Link from "next/link";
import { notFound } from "next/navigation";
import { ALTERNATIVES, PRICES_CHECKED, findAlternative } from "@/lib/alternatives";
import { SiteFooter, SiteHeader } from "../../site-chrome";
import { Faq } from "../../faq";

export const dynamicParams = false;
export const generateStaticParams = () => ALTERNATIVES.map((a) => ({ slug: a.slug }));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const a = findAlternative((await params).slug);
  if (!a) return {};
  return {
    title: `${a.name} alternative for Stripe failed payments | DeclineKit`,
    description: `An honest comparison of DeclineKit and ${a.name}: what each does, what each costs, and which one fits a small team on Stripe.`,
    alternates: { canonical: `/alternatives/${a.slug}` },
  };
}

export default async function AlternativePage({ params }: { params: Promise<{ slug: string }> }) {
  const a = findAlternative((await params).slug);
  if (!a) notFound();
  const rows: [string, string, string][] = [
    ["Price", a.pricing, "$29, $79 or $149/month by MRR. Flat, no cut of recoveries"],
    ["Focus", a.focus, "Failed and expiring cards on Stripe, nothing else"],
    ["Emails", "Configurable campaigns and templates", "Up to four plain-text notes over 12 days in your name, replies to your inbox"],
    ["Free to start", "See their site", "Free until we recover your first $100 (or 60 days), no card"],
  ];
  return (
    <>
      <SiteHeader />
      <main className="prose">
        <h1>DeclineKit vs. {a.name}</h1>
        <p className="lede">
          {a.summary} DeclineKit does one job: when a Stripe renewal is declined, it gets the customer to enter a
          working card. If that&rsquo;s the job you need done, here&rsquo;s how the two compare.
        </p>

        <div className="table-wrap">
          <table className="ledger">
            <thead><tr><th></th><th>{a.name}</th><th>DeclineKit</th></tr></thead>
            <tbody>{rows.map(([k, them, us]) => <tr key={k}><th scope="row">{k}</th><td>{them}</td><td>{us}</td></tr>)}</tbody>
          </table>
        </div>
        <p className="fine">{a.name} pricing from public sources, checked {PRICES_CHECKED}. Check their site for current plans.</p>

        <h2>Where {a.name} is the better pick</h2>
        <ul>{a.theyDoBetter.map((t) => <li key={t}>{t}</li>)}</ul>

        <h2>Where DeclineKit is the better pick</h2>
        <ul>{a.pickUsIf.map((t) => <li key={t}>{t}</li>)}</ul>

        <h2>Switching from {a.name}</h2>
        <p>{a.switchNote}</p>
        <ol>
          <li>Turn off {a.name}&rsquo;s failed-payment emails.</li>
          <li>Connect Stripe to DeclineKit. Invoices that are failing right now are imported, so nothing in progress is dropped.</li>
          <li>Preview the four emails in your business&rsquo;s name, set the reply-to address, and switch recovery on.</li>
        </ol>
        <p>Keep Stripe&rsquo;s Smart Retries on either way. They recover temporary declines; DeclineKit handles the cards retries can&rsquo;t fix.</p>

        <Faq
          items={[
            {
              q: `Is DeclineKit cheaper than ${a.name}?`,
              a: `DeclineKit is free until it recovers your first $100 (or for 60 days), then $29, $79 or $149 a month depending on your MRR, with no cut of what it recovers. ${a.name}: ${a.pricing}, checked ${PRICES_CHECKED}.`,
            },
            {
              q: "Does DeclineKit replace Stripe's Smart Retries?",
              a: "No. Keep Smart Retries on. Retries recover temporary declines like insufficient funds; DeclineKit emails customers whose card has expired or been replaced, which no retry can fix.",
            },
            {
              q: "Does DeclineKit see my customers' card numbers?",
              a: "No. Customers enter their new card on a Stripe-hosted page. DeclineKit only learns that a new card was saved, then retries the failed invoice.",
            },
            {
              q: "Which billing systems does DeclineKit support?",
              a: "Stripe Billing subscriptions only. If you bill through another processor, or through the App Store or Google Play, DeclineKit isn't a fit.",
            },
          ]}
        />

        <h2>Not sure you need either?</h2>
        <p>
          Run the <Link href="/audit">free audit</Link> first. It reads your last 90 days of Stripe invoices with a
          read-only key and shows how much declined cards cost you. If the number is small, Stripe&rsquo;s{" "}
          <Link href="/guides/stripe-smart-retries-vs-dunning-emails">Smart Retries and built-in emails</Link> may be enough.
        </p>

        <aside className="callout">
          <h2>Try DeclineKit free until it recovers your first $100</h2>
          <p>No card required. You only pay once it has paid for itself.</p>
          <div className="cta-row">
            <Link href="/audit" className="btn btn-primary">See what failed payments cost you</Link>
            <Link href="/login" className="btn">Start free</Link>
          </div>
        </aside>

        <p>
          Other comparisons:{" "}
          {ALTERNATIVES.filter((o) => o.slug !== a.slug).map((o, i) => (
            <span key={o.slug}>{i > 0 && " · "}<Link href={`/alternatives/${o.slug}`}>DeclineKit vs. {o.name}</Link></span>
          ))}
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
