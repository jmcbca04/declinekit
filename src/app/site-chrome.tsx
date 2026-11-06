import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link href="/" className="wordmark">DeclineKit</Link>
      <nav>
        <Link href="/audit">Free audit</Link>
        <Link href="/open">Open stats</Link>
        <Link href="/decline-codes">Decline codes</Link>
        <Link href="/#pricing">Pricing</Link>
        <Link href="/login">Sign in</Link>
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <p>DeclineKit recovers failed subscription payments for businesses on Stripe.</p>
      <nav>
        <Link href="/audit">Failed payment audit</Link>
        <Link href="/failed-payment-calculator">Failed payment calculator</Link>
        <Link href="/dunning-email-templates">Dunning email templates</Link>
        <Link href="/guides/stripe-failed-payments">Stripe failed payments guide</Link>
        <Link href="/guides/stripe-smart-retries-vs-dunning-emails">Smart Retries vs. dunning</Link>
        <Link href="/decline-codes">Stripe decline codes</Link>
        <Link href="/for/ghost">For Ghost publications</Link>
        <Link href="/for/beehiiv">For beehiiv newsletters</Link>
        <Link href="/for/mobile-apps">For mobile apps on Stripe</Link>
        <Link href="/alternatives/churnkey">Churnkey alternative</Link>
        <Link href="/alternatives/churn-buster">Churn Buster alternative</Link>
        <Link href="/alternatives/baremetrics-recover">Baremetrics Recover alternative</Link>
        <Link href="/#pricing">Pricing</Link>
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
        <a href="https://www.quickping.dev/to/declinekit">Support</a>
      </nav>
    </footer>
  );
}
