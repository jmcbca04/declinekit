import Stripe from "stripe";
import { notFound } from "next/navigation";
import { sql } from "@/lib/db";
import { clientFor } from "@/lib/stripe";
import { loadReminder } from "../shared";

export const metadata = { title: "Card updated", robots: { index: false } };

export default async function ExpiringDone({ params, searchParams }: {
  params: Promise<{ token: string }>; searchParams: Promise<{ session_id?: string }>;
}) {
  const { token } = await params;
  const { session_id } = await searchParams;
  const data = await loadReminder(token);
  if (!data || !session_id) notFound();
  const { r, account, brand } = data;

  if (!r.card_updated_at) {
    const stripe = clientFor(account);
    const session = await stripe.checkout.sessions.retrieve(session_id, { expand: ["setup_intent"] });
    const si = session.setup_intent as Stripe.SetupIntent | null;
    if (session.customer !== r.stripe_customer_id || session.status !== "complete" || si?.status !== "succeeded" || !si.payment_method) notFound();
    const pm = typeof si.payment_method === "string" ? si.payment_method : si.payment_method.id;
    await stripe.customers.update(r.stripe_customer_id, { invoice_settings: { default_payment_method: pm } });
    await stripe.subscriptions.update(r.stripe_subscription_id, { default_payment_method: pm });
    await sql`UPDATE expiring_reminders SET card_updated_at = now() WHERE id = ${r.id}`;
  }

  return (
    <main className="customer-page">
      <div className="customer-card">
        <p className="customer-brand">{brand}</p>
        <h1>Card updated</h1>
        <p>Thanks! Your new card is saved and your {brand} subscription will renew as usual. You can close this page.</p>
      </div>
    </main>
  );
}
