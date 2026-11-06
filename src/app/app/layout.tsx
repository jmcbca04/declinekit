import Link from "next/link";
import { CLOUD } from "@/lib/config";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PENDING_LINK_COOKIE } from "@/lib/stripe-app";
import { requireAccount, isActive, recoveredCents } from "@/lib/auth";
import { FREE_RECOVERY_CENTS } from "@/lib/plans";
import { money } from "@/lib/format";
import { logout } from "./actions";
import { TrackGoalOnce } from "./track-goal";

export const dynamic = "force-dynamic";
export const metadata = { title: "DeclineKit", robots: { index: false } };

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const account = await requireAccount();
  // Signed in after starting "Finish setup" from the Stripe Dashboard: complete the link.
  if ((await cookies()).get(PENDING_LINK_COOKIE)) redirect("/api/stripe-app/link");
  const daysLeft = Math.ceil((new Date(account.trial_ends_at).getTime() - Date.now()) / 86400_000);
  const recovered = account.subscription_status === "trialing" ? await recoveredCents(account.id) : 0;
  const free = isActive(account, recovered);
  return (
    <div className="app">
      {Date.now() - new Date(account.created_at).getTime() < 15 * 60_000 && <TrackGoalOnce goal="signup" onceKey={account.id} />}
      <header className="app-header">
        <Link href="/app" className="wordmark">DeclineKit</Link>
        <nav>
          <Link href="/app">Recoveries</Link>
          <Link href="/app/settings">Settings &amp; billing</Link>
          <form action={logout}><button className="link-button">Sign out</button></form>
        </nav>
      </header>
      {CLOUD && account.stripe_livemode === false && (
        <div className="banner">Connected to a Stripe sandbox. Everything works and it&apos;s always free; test recoveries don&apos;t count toward your free $100.</div>
      )}
      {CLOUD && account.subscription_status === "trialing" && account.stripe_livemode !== false && (
        <div className={free ? "banner" : "banner banner-warn"}>
          {free
            ? `Free until we recover $100 for you: ${money(recovered)} so far, ${daysLeft} day${daysLeft === 1 ? "" : "s"} left.`
            : recovered >= FREE_RECOVERY_CENTS
              ? `DeclineKit has recovered ${money(recovered)} for you. Pick a plan to keep recovering.`
              : "Your free period has ended and recovery emails are paused."}{" "}
          <Link href="/app/settings#plans">Choose a plan</Link>
        </div>
      )}
      {CLOUD && account.subscription_status === "canceled" && (
        <div className="banner banner-warn">Your subscription is cancelled and recovery emails are paused. <Link href="/app/settings#plans">Resubscribe</Link></div>
      )}
      <main className="app-main">{children}</main>
    </div>
  );
}
