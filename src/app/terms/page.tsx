import { SiteFooter, SiteHeader } from "../site-chrome";

export const metadata = { title: "Terms — DeclineKit" };

export default function Terms() {
  return (
    <>
      <SiteHeader />
      <main className="prose">
        <h1>Terms</h1>
        <p>By using DeclineKit you agree to these terms.</p>
        <h2>The service</h2>
        <p>DeclineKit emails your customers when their subscription payments fail and lets them update their card on a Stripe-hosted page. You&rsquo;re responsible for having a lawful basis to email your customers about their billing.</p>
        <h2>Billing</h2>
        <p>Plans are billed monthly in advance through Stripe. You can cancel any time from Settings; you keep access until the end of the paid period. We don&rsquo;t offer refunds for partial months.</p>
        <h2>No guarantees</h2>
        <p>We work hard to recover payments, but we can&rsquo;t guarantee any particular amount will be recovered. The service is provided as is, and our liability is limited to the fees you paid in the previous three months.</p>
        <h2>Changes</h2>
        <p>We&rsquo;ll email you at least 14 days before any material change to these terms.</p>
      </main>
      <SiteFooter />
    </>
  );
}
