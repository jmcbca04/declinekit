import Link from "next/link";
import { SiteFooter, SiteHeader } from "../../site-chrome";

export const metadata = {
  title: "Failed payment recovery for mobile apps on Stripe and RevenueCat | DeclineKit",
  description:
    "Moved app subscriptions to Stripe web checkout to skip Apple's cut? You also left Apple's billing retry behind. DeclineKit emails subscribers when a card fails and restores the subscription, including with RevenueCat's Stripe Billing integration.",
  alternates: { canonical: "/for/mobile-apps" },
};

export default function ForMobileApps() {
  return (
    <>
      <SiteHeader />
      <main className="prose">
        <h1>Moved your app&rsquo;s subscriptions to Stripe? Declined cards are your problem now.</h1>
        <p className="lede">
          Web paywalls and link-out checkouts let you keep the 15&ndash;30% Apple and Google take. But inside the App
          Store, Apple chased failed renewals for you with its own retries and grace period. On Stripe, a subscriber
          whose card expires just churns, and you only notice when MRR dips.
        </p>

        <h2>Which app setups this is for</h2>
        <p>DeclineKit works when your subscriptions live in <strong>Stripe Billing</strong>, in your own Stripe account:</p>
        <ul>
          <li>A web paywall or web-to-app funnel that checks out with Stripe</li>
          <li>Link-out purchases from your iOS or Android app to a Stripe checkout</li>
          <li>
            <strong>RevenueCat with its Stripe Billing integration</strong>: Stripe runs the subscription and
            RevenueCat unlocks access in the app. When DeclineKit gets a failed renewal paid, Stripe marks the invoice
            paid and RevenueCat restores the subscriber&rsquo;s access on its own.
          </li>
        </ul>
        <p>It does not apply to:</p>
        <ul>
          <li>
            <strong>In-app purchases through the App Store or Google Play.</strong> Apple and Google bill those and
            handle their own retries; nothing reaches Stripe.
          </li>
          <li>
            <strong>RevenueCat Web Billing.</strong> That&rsquo;s RevenueCat&rsquo;s own billing engine, which uses Stripe
            only to process payments and doesn&rsquo;t create Stripe subscriptions. It already retries failed renewals and
            emails subscribers itself, so you don&rsquo;t need us there.
          </li>
        </ul>
        <p>
          Not sure which you have? If your subscriptions appear under Billing &rarr; Subscriptions in the Stripe
          Dashboard, you&rsquo;re on Stripe Billing.
        </p>

        <h2>What DeclineKit does</h2>
        <ol>
          <li><strong>Connects to your Stripe account</strong> with a restricted key. No SDK, nothing to ship in the app.</li>
          <li><strong>Emails the subscriber in your app&rsquo;s name</strong> when a renewal is declined: up to four short notes over 12 days. Replies come to you.</li>
          <li><strong>Links to a Stripe-hosted card form</strong> that works on a phone. The moment they save a new card, we retry the invoice and the subscription carries on.</li>
          <li><strong>Warns subscribers before their card expires</strong>, so many renewals never fail at all.</li>
        </ol>
        <p>
          Consumer apps tend to see more declines than B2B software: more debit cards, more{" "}
          <Link href="/decline-codes/insufficient_funds">insufficient funds</Link>, more{" "}
          <Link href="/decline-codes/expired_card">expired cards</Link>. Keep Stripe&rsquo;s Smart Retries on for the
          temporary ones. DeclineKit goes after the ones retries can&rsquo;t fix.{" "}
          <Link href="/guides/stripe-smart-retries-vs-dunning-emails">How the two fit together</Link>.
        </p>

        <h2>Setup takes a few minutes</h2>
        <ol>
          <li>Install DeclineKit from the <a href="https://marketplace.stripe.com/apps/declinekit">Stripe App Marketplace</a> into the Stripe account your web checkout uses.</li>
          <li>Set your app&rsquo;s name and reply-to address, and preview the emails.</li>
          <li>Switch recovery on, and turn off Stripe&rsquo;s own failed-payment emails so subscribers don&rsquo;t get two.</li>
        </ol>

        <aside className="callout">
          <h2>See what declined cards cost your app last quarter</h2>
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
