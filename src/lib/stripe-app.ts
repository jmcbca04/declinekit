import { decrypt, encrypt } from "./crypto";

// Cookie holding the one-time state for a Stripe App install started from DeclineKit.
export const INSTALL_STATE_COOKIE = "dk_install_state";
// Cookie holding a pending marketplace install to attach after the user signs in.
export const PENDING_LINK_COOKIE = "dk_pending_link";

// The install link from the app's External test or Settings tab in the Stripe Dashboard.
// Unset until the app is uploaded, in which case the dashboard falls back to a pasted key.
export const appInstallAvailable = () => !!process.env.STRIPE_APP_INSTALL_LINK;

// A short-lived, encrypted token naming a Stripe account that installed the app from the
// marketplace. Only our backend can mint it, and only after Stripe signed the request.
const LINK_TTL_MS = 15 * 60_000;
export const mintLinkToken = (stripeAccountId: string) =>
  encrypt(JSON.stringify({ a: stripeAccountId, e: Date.now() + LINK_TTL_MS }));

export function readLinkToken(token: string): string | null {
  try {
    const { a, e } = JSON.parse(decrypt(token)) as { a: string; e: number };
    return e > Date.now() && /^acct_\w+$/.test(a) ? a : null;
  } catch {
    return null;
  }
}
