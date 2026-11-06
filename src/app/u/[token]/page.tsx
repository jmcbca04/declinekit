import { notFound, redirect } from "next/navigation";
import { clientFor } from "@/lib/stripe";
import { appUrl, money } from "@/lib/format";
import { load } from "./shared";

export const metadata = { title: "Update your payment method", robots: { index: false } };

export default async function UpdateCard({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const data = await load(token);
  if (!data) notFound();
  const { f, brand } = data;

  async function startCheckout() {
    "use server";
    const d = await load(token);
    if (!d || d.f.status !== "open") redirect(`/u/${token}`);
    const session = await clientFor(d.account).checkout.sessions.create({
      mode: "setup",
      // Cards only: wallets like Klarna or Cash App can't reliably pay recurring invoices.
      allowed_payment_method_types: ["card"],
      currency: d.f.currency,
      customer: d.f.stripe_customer_id,
      success_url: `${appUrl()}/u/${token}/done?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl()}/u/${token}`,
    });
    redirect(session.url!);
  }

  return (
    <main className="customer-page">
      <div className="customer-card">
        <p className="customer-brand">{brand}</p>
        {f.status === "open" ? (
          <>
            <h1>Update your payment method</h1>
            <p>
              Your last payment of <strong>{money(f.amount_cents, f.currency)}</strong> was declined.
              Add a working card and we&rsquo;ll retry the payment right away.
            </p>
            <form action={startCheckout}>
              <button className="btn btn-primary btn-block">Update card</button>
            </form>
            <p className="customer-fine">Card details are handled securely by Stripe.</p>
          </>
        ) : (
          <>
            <h1>You&rsquo;re all set</h1>
            <p>There&rsquo;s nothing to pay on this invoice anymore. Thanks!</p>
          </>
        )}
      </div>
    </main>
  );
}
