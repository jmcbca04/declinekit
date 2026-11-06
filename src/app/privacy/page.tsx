import { SiteFooter, SiteHeader } from "../site-chrome";

export const metadata = { title: "Privacy — DeclineKit" };

export default function Privacy() {
  return (
    <>
      <SiteHeader />
      <main className="prose">
        <h1>Privacy</h1>
        <p>DeclineKit stores the minimum it needs to recover failed payments for you.</p>
        <h2>What we store</h2>
        <ul>
          <li>Your email address and the settings you choose.</li>
          <li>Your Stripe restricted key, encrypted with AES-256-GCM.</li>
          <li>For each failed invoice: the invoice ID, customer ID, your customer&rsquo;s name and email, the amount, and the emails we sent.</li>
          <li>For each expiring-card reminder: the customer and subscription IDs, your customer&rsquo;s name and email, and the card&rsquo;s expiry month. Never the card number.</li>
        </ul>
        <p>If you follow the experiment on /open, we store your email address to send a weekly update. Every email has a one-click unsubscribe.</p>
        <p>We keep these records while your account exists so your dashboard can show what was recovered. Card-update links stop working 60 days after they&rsquo;re sent.</p>
        <p>We never see or store card numbers. Card updates happen on Stripe-hosted pages.</p>
        <h2>The free audit</h2>
        <p>The key you paste into the audit is used once, in memory, and never saved. We keep the totals and the email address you optionally provide.</p>
        <h2>Who we share data with</h2>
        <p>Stripe (payments), Neon (database), Mailgun (email delivery), Vercel (hosting), and DataFast (website analytics). We don&rsquo;t sell data or use it for advertising.</p>
        <p>When you first visit, the site stores a small first-party cookie noting the site that referred you, the page you landed on and the last few pages you viewed. It stays in your browser unless you sign up, when we use it to see how you found DeclineKit.</p>
        <h2>Deleting your data</h2>
        <p>
          In Settings, &ldquo;Disconnect Stripe&rdquo; removes our webhook and deletes your key, and &ldquo;Delete my account&rdquo;
          deletes your account and every customer record immediately. If you can&rsquo;t sign in,{" "}
          <a href="https://www.quickping.dev/to/declinekit">contact support</a> and we&rsquo;ll do it within 7 days.
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
