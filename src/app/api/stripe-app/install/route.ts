import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { requireAccount } from "@/lib/auth";
import { randomToken } from "@/lib/crypto";
import { appUrl } from "@/lib/format";
import { INSTALL_STATE_COOKIE } from "@/lib/stripe-app";

// Starts a Stripe App install from DeclineKit: sends the signed-in user to Stripe's install
// page with a one-time state value we check when Stripe sends them back.
export async function GET() {
  await requireAccount();
  const link = process.env.STRIPE_APP_INSTALL_LINK;
  if (!link) return NextResponse.redirect(`${appUrl()}/app?install=unavailable`);
  const state = randomToken(18);
  (await cookies()).set(INSTALL_STATE_COOKIE, state, { httpOnly: true, secure: true, sameSite: "lax", maxAge: 30 * 60, path: "/" });
  const url = new URL(link);
  url.searchParams.set("redirect_uri", `${appUrl()}/api/stripe-app/installed`);
  url.searchParams.set("state", state);
  return NextResponse.redirect(url);
}
