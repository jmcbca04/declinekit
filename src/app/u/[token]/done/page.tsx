import Stripe from "stripe";
import { notFound } from "next/navigation";
import { clientFor, subscriptionIdOf } from "@/lib/stripe";
import { markRecovered } from "@/lib/recovery";
import { money } from "@/lib/format";
import { sendFreeLimitReached, sendInternal } from "@/lib/email";
import { recoveredCents } from "@/lib/auth";
import { FREE_RECOVERY_CENTS } from "@/lib/plans";
import { load } from "../shared";
import { overLimit } from "@/lib/rate-limit";

export const metadata = { title: "Payment updated", robots: { index: false } };

export default async function Done({ params, searchParams }: {
  params: Promise<{ token: string }>; searchParams: Promise<{ session_id?: string }>;
}) {
  const { token } = await params;
  const { session_id } = await searchParams;
  const data = await load(token);
  if (!data || !session_id) notFound();
  const { f, account, brand } = data;

  let outcome: "paid" | "declined" | "already" = "already";
  if (f.status === "open") {
    const stripe = clientFor(account);
    const session = await stripe.checkout.sessions.retrieve(session_id, { expand: ["setup_intent"] });
    const si = session.setup_intent as Stripe.SetupIntent | null;
    if (session.customer !== f.stripe_customer_id || session.status !== "complete" || si?.status !== "succeeded" || !si.payment_method) notFound();
    const pm = typeof si.payment_method === "string" ? si.payment_method : si.payment_method.id;

    await stripe.customers.update(f.stripe_customer_id, { invoice_settings: { default_payment_method: pm } });
    const inv = await stripe.invoices.retrieve(f.stripe_invoice_id);
    const subId = subscriptionIdOf(inv);
    if (subId) await stripe.subscriptions.update(subId, { default_payment_method: pm });
    // Charge each newly saved card once. Refreshing this page must never re-charge a card the
    // bank just declined (card networks fine merchants for repeated retries on declined cards),
    // and a single invoice gets at most 5 card attempts a day however many cards are tried.
    const repeat = await overLimit(`charge-session:${session_id}`, 2, 24 * 60);
    const tooMany = !repeat && (await overLimit(`charge-invoice:${f.stripe_invoice_id}`, 6, 24 * 60));
    try {
      if (repeat || tooMany) throw new Error("charge attempt not repeated");
      if (inv.status === "open") await stripe.invoices.pay(inv.id!, { payment_method: pm });
      await markRecovered(account.id, inv.id!, "card_update");
      outcome = "paid";
      await sendInternal(`${f.livemode === false ? "[sandbox] " : ""}Recovered ${money(f.amount_cents, f.currency)} for ${brand}`, `account ${account.email}`);
    } catch {
      outcome = "declined";
    }
    // Crossing the free allowance with this recovery: tell the account owner once.
    if (outcome === "paid" && account.subscription_status === "trialing") {
      try {
        const total = await recoveredCents(account.id);
        if (total >= FREE_RECOVERY_CENTS && total - f.amount_cents < FREE_RECOVERY_CENTS) {
          await sendFreeLimitReached(account.email, money(total, f.currency));
        }
      } catch (e) {
        console.error("free limit check failed", e);
      }
    }
  }

  return (
    <main className="customer-page">
      <div className="customer-card">
        <p className="customer-brand">{brand}</p>
        {outcome === "declined" ? (
          <>
            <h1>That card was declined too</h1>
            <p>Your new card is saved, but the bank declined the {money(f.amount_cents, f.currency)} charge. Try a different card.</p>
            <a className="btn btn-primary btn-block" href={`/u/${token}`}>Use a different card</a>
          </>
        ) : (
          <>
            <h1>Payment complete</h1>
            <p>Thanks! Your card is updated and your {brand} subscription is active. You can close this page.</p>
          </>
        )}
      </div>
    </main>
  );
}
