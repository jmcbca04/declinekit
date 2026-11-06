import Stripe from "stripe";
import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { platform, PLANS } from "@/lib/stripe";
import { sendInternal } from "@/lib/email";

function planFor(sub: Stripe.Subscription) {
  const price = sub.items.data[0]?.price.id;
  return (Object.keys(PLANS) as (keyof typeof PLANS)[]).find((p) => process.env[PLANS[p].env] === price) ?? null;
}

// Events from DeclineKit's own Stripe account (our revenue).
export async function POST(req: Request) {
  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = platform().webhooks.constructEvent(body, req.headers.get("stripe-signature") ?? "", process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return new NextResponse("bad signature", { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const s = event.data.object as Stripe.Checkout.Session;
    if (s.mode === "subscription" && s.client_reference_id) {
      const sub = await platform().subscriptions.retrieve(s.subscription as string);
      await sql`UPDATE accounts SET billing_customer_id = ${s.customer as string}, billing_subscription_id = ${sub.id},
                  plan = ${planFor(sub)}, subscription_status = ${sub.status}
                WHERE id = ${s.client_reference_id}`;
      await sendInternal(`New subscriber: ${s.customer_details?.email}`, `Plan: ${planFor(sub)}\nAmount: ${(s.amount_total ?? 0) / 100}`);
    }
  }
  if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;
    const status = event.type === "customer.subscription.deleted" ? "canceled" : sub.status;
    await sql`UPDATE accounts SET subscription_status = ${status}, plan = ${planFor(sub)}
              WHERE billing_subscription_id = ${sub.id}`;
  }
  return NextResponse.json({ received: true });
}
