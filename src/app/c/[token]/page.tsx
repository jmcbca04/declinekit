import { notFound, redirect } from "next/navigation";
import { clientFor } from "@/lib/stripe";
import { appUrl } from "@/lib/format";
import { loadReminder } from "./shared";

export const metadata = { title: "Update your card", robots: { index: false } };

export default async function UpdateExpiringCard({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const data = await loadReminder(token);
  if (!data) notFound();
  const { r, brand } = data;

  async function startCheckout() {
    "use server";
    const d = await loadReminder(token);
    if (!d) redirect(`/c/${token}`);
    const stripe = clientFor(d.account);
    const sub = await stripe.subscriptions.retrieve(d.r.stripe_subscription_id);
    const session = await stripe.checkout.sessions.create({
      mode: "setup",
      allowed_payment_method_types: ["card"],
      currency: sub.currency,
      customer: d.r.stripe_customer_id,
      success_url: `${appUrl()}/c/${token}/done?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl()}/c/${token}`,
    });
    redirect(session.url!);
  }

  return (
    <main className="customer-page">
      <div className="customer-card">
        <p className="customer-brand">{brand}</p>
        {r.card_updated_at ? (
          <>
            <h1>You&rsquo;re all set</h1>
            <p>Your new card is saved. Thanks!</p>
          </>
        ) : (
          <>
            <h1>Update your card</h1>
            <p>The card on your {brand} subscription is about to expire. Add your new card so your next payment goes through.</p>
            <form action={startCheckout}>
              <button className="btn btn-primary btn-block">Add new card</button>
            </form>
            <p className="customer-fine">Card details are handled securely by Stripe.</p>
          </>
        )}
      </div>
    </main>
  );
}
