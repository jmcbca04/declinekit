import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sql } from "@/lib/db";
import { currentAccount } from "@/lib/auth";
import { appUrl } from "@/lib/format";
import { linkAppInstall } from "@/lib/recovery";
import { sendInternal } from "@/lib/email";
import { PENDING_LINK_COOKIE, readLinkToken } from "@/lib/stripe-app";

const back = (q: string) => NextResponse.redirect(`${appUrl()}/app?install=${q}`);

// "Finish setup" from inside the Stripe Dashboard after a marketplace install. The token
// names the Stripe account; we hold it in a cookie until the user has signed in to DeclineKit.
export async function GET(req: Request) {
  const jar = await cookies();
  const token = new URL(req.url).searchParams.get("t") ?? jar.get(PENDING_LINK_COOKIE)?.value ?? "";
  const stripeAccountId = readLinkToken(token);
  if (!stripeAccountId) {
    jar.delete(PENDING_LINK_COOKIE);
    return back("invalid");
  }

  const account = await currentAccount();
  if (!account) {
    jar.set(PENDING_LINK_COOKIE, token, { httpOnly: true, secure: true, sameSite: "lax", maxAge: 15 * 60, path: "/" });
    return NextResponse.redirect(`${appUrl()}/login`);
  }
  jar.delete(PENDING_LINK_COOKIE);

  const [taken] = await sql`SELECT id FROM accounts WHERE stripe_account_id = ${stripeAccountId}
                            AND stripe_connection = 'app' AND id <> ${account.id}`;
  if (taken) return back("already_linked");

  await linkAppInstall(account, stripeAccountId);
  await sendInternal(`Stripe App linked from the marketplace: ${account.email}`, `Stripe account ${stripeAccountId}`);
  return back("done");
}
