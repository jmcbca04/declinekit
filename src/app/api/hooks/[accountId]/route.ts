import Stripe from "stripe";
import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { decrypt } from "@/lib/crypto";
import { handleInvoiceEvent } from "@/lib/recovery";
import type { Account } from "@/lib/auth";

// Events from our customers' Stripe accounts.
export async function POST(req: Request, { params }: { params: Promise<{ accountId: string }> }) {
  const { accountId } = await params;
  if (!/^[0-9a-f-]{36}$/.test(accountId)) return new NextResponse("not found", { status: 404 });
  const rows = await sql`SELECT * FROM accounts WHERE id = ${accountId}`;
  const account = rows[0] as Account | undefined;
  if (!account?.webhook_secret_enc) return new NextResponse("not found", { status: 404 });

  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = Stripe.webhooks.constructEvent(body, req.headers.get("stripe-signature") ?? "", decrypt(account.webhook_secret_enc));
  } catch {
    return new NextResponse("bad signature", { status: 400 });
  }

  await handleInvoiceEvent(account, event);
  return NextResponse.json({ received: true });
}
