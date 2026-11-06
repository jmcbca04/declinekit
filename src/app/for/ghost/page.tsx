import Link from "next/link";
import { SiteFooter, SiteHeader } from "../../site-chrome";

export const metadata = {
  title: "Failed payment recovery for Ghost publications | DeclineKit",
  description:
    "When a paid Ghost member’s card is declined, Ghost waits on Stripe’s retries and then downgrades them to free. DeclineKit emails them in your publication’s name and recovers the subscription.",
  alternates: { canonical: "/for/ghost" },
};

export default function ForGhost() {
  return (
    <>
      <SiteHeader />
      <main className="prose">
        <h1>Stop losing paid Ghost members to declined cards</h1>
        <p className="lede">
          When a paid member&rsquo;s renewal fails, Ghost keeps their access while Stripe retries the card. If every
          retry fails, the subscription is cancelled and they quietly become a free member. Most of them never meant
          to leave. Their card just expired.
        </p>

        <h2>Why Ghost publications lose members this way</h2>
        <p>
          Ghost hands billing to your own Stripe account and doesn&rsquo;t send a dunning sequence of its own. Stripe&rsquo;s
          retries can&rsquo;t fix a card that has <Link href="/decline-codes/expired_card">expired</Link> or been{" "}
          <Link href="/decline-codes/incorrect_number">replaced</Link>, so unless the reader hears from you and enters a new
          card, the paid subscription ends.
        </p>

        <h2>What DeclineKit does for a Ghost publication</h2>
        <ol>
          <li><strong>Connects to the Stripe account Ghost uses</strong> with a restricted key. Nothing to install in Ghost.</li>
          <li><strong>Emails the reader in your publication&rsquo;s name</strong> when a renewal is declined: up to four short plain-text notes over 12 days. Replies come to you.</li>
          <li><strong>Links to a Stripe-hosted card form.</strong> The moment they save a new card, we retry the invoice, the subscription carries on, and Ghost keeps them as a paid member.</li>
          <li><strong>Warns readers before a card expires</strong>, so many renewals never fail at all.</li>
        </ol>
        <p>
          Keep Stripe&rsquo;s Smart Retries on. They recover temporary declines. DeclineKit goes after the ones retries
          can&rsquo;t fix. <Link href="/guides/stripe-smart-retries-vs-dunning-emails">How the two fit together</Link>.
        </p>

        <h2>Setup takes a few minutes</h2>
        <ol>
          <li>Open the Stripe account connected to your Ghost site (Ghost Admin &rarr; Settings &rarr; Membership shows which one).</li>
          <li>Install DeclineKit from the <a href="https://marketplace.stripe.com/apps/declinekit">Stripe App Marketplace</a> into that account. (Or create a restricted key with the permissions DeclineKit lists and paste it in.)</li>
          <li>Set your publication name and reply-to address, preview the emails, and switch recovery on.</li>
          <li>Turn off Stripe&rsquo;s own failed-payment emails so readers don&rsquo;t get two.</li>
        </ol>

        <aside className="callout">
          <h2>See how many paid members you lost last quarter</h2>
          <p>
            The free audit reads the last 90 days of invoices in your Stripe account with a read-only key and totals
            every renewal that failed and never got paid. Then try DeclineKit free until it recovers your first $100, no card required.
          </p>
          <div className="cta-row">
            <Link href="/audit" className="btn btn-primary">Run the free audit</Link>
            <Link href="/login" className="btn">Start free</Link>
          </div>
        </aside>
      </main>
      <SiteFooter />
    </>
  );
}
