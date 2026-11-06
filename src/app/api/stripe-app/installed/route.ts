import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sql } from "@/lib/db";
import { currentAccount } from "@/lib/auth";
import { appUrl } from "@/lib/format";
import { platform } from "@/lib/stripe";
import { linkAppInstall } from "@/lib/recovery";
import { sendInternal } from "@/lib/email";
import { INSTALL_STATE_COOKIE } from "@/lib/stripe-app";

const back = (q: string) => NextResponse.redirect(`${appUrl()}/app?install=${q}`);

// Stripe sends the installer here after they approve the app. We trust the account_id only
// if Stripe's install_signature checks out and the state matches the cookie we set.
export async function GET(req: Request) {
  const p = new URL(req.url).searchParams;
  if (p.get("error")) return back("cancelled");

  const account = await currentAccount();
  if (!account) return NextResponse.redirect(`${appUrl()}/login`);

  const jar = await cookies();
  const expected = jar.get(INSTALL_STATE_COOKIE)?.value;
  jar.delete(INSTALL_STATE_COOKIE);
  const state = p.get("state") ?? "";
  const userId = p.get("user_id") ?? "";
  const stripeAccountId = p.get("account_id") ?? "";
  if (!expected || state !== expected || !/^acct_\w+$/.test(stripeAccountId)) return back("invalid");

  try {
    // Field order matters: state, then user_id, then account_id.
    platform().webhooks.signature!.verifyHeader(
      JSON.stringify({ state, user_id: userId, account_id: stripeAccountId }),
      p.get("install_signature") ?? "",
      process.env.STRIPE_APP_SIGNING_SECRET!,
    );
  } catch {
    return back("invalid");
  }

  const [taken] = await sql`SELECT id FROM accounts WHERE stripe_account_id = ${stripeAccountId}
                            AND stripe_connection = 'app' AND id <> ${account.id}`;
  if (taken) return back("already_linked");

  await linkAppInstall(account, stripeAccountId);
  await sendInternal(`Stripe App installed: ${account.email}`, `Stripe account ${stripeAccountId}`);
  return back("done");
}
