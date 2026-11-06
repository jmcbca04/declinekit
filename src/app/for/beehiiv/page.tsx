import Link from "next/link";
import { SiteFooter, SiteHeader } from "../../site-chrome";

export const metadata = {
  title: "Failed payment recovery for beehiiv paid newsletters | DeclineKit",
  description:
    "beehiiv bills paid subscriptions through a Stripe account it creates for you, where failed-payment emails start switched off. DeclineKit emails readers in your newsletter’s name when a renewal is declined.",
  alternates: { canonical: "/for/beehiiv" },
};

export default function ForBeehiiv() {
  return (
    <>
      <SiteHeader />
      <main className="prose">
        <h1>Your beehiiv paid subscribers are churning on declined cards</h1>
        <p className="lede">
          When you turned on paid subscriptions, beehiiv set up a Stripe account for your newsletter. beehiiv&rsquo;s own
          help docs note that Stripe&rsquo;s failed-payment and expiring-card emails are off by default on a new
          account. So when a reader&rsquo;s card is declined, nobody tells them, and the subscription ends.
        </p>

        <h2>Why retries alone don&rsquo;t save them</h2>
        <p>
          Stripe can retry a declined renewal, and that recovers temporary problems like{" "}
          <Link href="/decline-codes/insufficient_funds">insufficient funds</Link>. But a card that has{" "}
          <Link href="/decline-codes/expired_card">expired</Link> or been{" "}
          <Link href="/decline-codes/incorrect_number">replaced</Link> will fail every time. Those readers only come back if
          someone asks them for a new card.
        </p>

        <h2>What DeclineKit does for a beehiiv newsletter</h2>
        <ol>
          <li><strong>Connects to the Stripe account beehiiv created</strong> with a restricted key. Nothing to change in beehiiv.</li>
          <li><strong>Emails the reader in your newsletter&rsquo;s name</strong> when a renewal is declined: up to four short plain-text notes over 12 days. Replies come to you.</li>
          <li><strong>Links to a Stripe-hosted card form</strong> and retries the renewal the moment they save a new card, so they stay a paid subscriber.</li>
          <li><strong>Warns readers before a card expires</strong>, so many renewals never fail at all.</li>
        </ol>

        <h2>Setup takes a few minutes</h2>
        <ol>
          <li>Sign in to <a href="https://dashboard.stripe.com" target="_blank" rel="noreferrer">Stripe</a> and switch to the account beehiiv created for your newsletter.</li>
          <li>Install DeclineKit from the <a href="https://marketplace.stripe.com/apps/declinekit">Stripe App Marketplace</a> into that account. (Or sign up for DeclineKit and use the button that opens Stripe&rsquo;s key form with everything filled in.)</li>
          <li>Set your newsletter name and reply-to address, preview the emails, and switch recovery on.</li>
        </ol>

        <aside className="callout">
          <h2>See how many paid subscribers you lost last quarter</h2>
          <p>
            The free audit reads the last 90 days of invoices with a read-only key and totals every renewal that failed
            and never got paid. Then try DeclineKit free until it recovers your first $100, no card required.
          </p>
          <div className="cta-row">
            <Link href="/audit" className="btn btn-primary">Run the free audit</Link>
            <Link href="/login" className="btn">Start free</Link>
          </div>
        </aside>
        <p>Also on Ghost? <Link href="/for/ghost">DeclineKit for Ghost publications</Link>.</p>
      </main>
      <SiteFooter />
    </>
  );
}
