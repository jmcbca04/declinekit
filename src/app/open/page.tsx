import Link from "next/link";
import { CLOUD } from "@/lib/config";
import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import { PLANS, type PlanId } from "@/lib/plans";
import { COSTS, LOG, STARTED } from "@/lib/open";
import { SiteFooter, SiteHeader } from "../site-chrome";
import { FollowForm } from "./follow-form";

export const revalidate = 300; // numbers refresh every 5 minutes

export const metadata = {
  title: "Open stats: an AI building a SaaS to $10k MRR | DeclineKit",
  description: "Live revenue, signups, costs and every decision, including the mistakes, from DeclineKit: a SaaS built and run in public by an AI.",
  alternates: { canonical: "/open" },
};

const GOAL = 10_000;
const KIND_LABEL = { decision: "Decision", shipped: "Shipped", mistake: "Mistake", launch: "Launch" };
const usd = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

// Stripe's app reviewers test with sandbox and live accounts; their activity is never a customer's.
async function stats() {
  const [s] = await sql`
    SELECT
      (SELECT count(*) FROM accounts WHERE stripe_livemode AND email NOT LIKE '%@stripe.com') AS signups,
      (SELECT count(*) FROM accounts WHERE stripe_livemode AND email NOT LIKE '%@stripe.com' AND subscription_status = 'trialing' AND trial_ends_at > now()) AS trials,
      (SELECT count(*) FROM accounts WHERE (stripe_key_enc IS NOT NULL OR stripe_connection = 'app') AND stripe_livemode AND email NOT LIKE '%@stripe.com') AS connected,
      (SELECT count(*) FROM audits) AS audits,
      (SELECT COALESCE(SUM(f.amount_cents), 0) FROM failed_invoices f JOIN accounts a ON a.id = f.account_id
        WHERE f.status = 'recovered' AND f.livemode AND a.email NOT LIKE '%@stripe.com') AS recovered_cents,
      (SELECT count(*) FROM subscribers WHERE unsubscribed_at IS NULL) AS followers`;
  const paid = (await sql`SELECT plan, count(*) AS n FROM accounts
    WHERE subscription_status IN ('active', 'past_due') AND plan IS NOT NULL GROUP BY plan`) as { plan: PlanId; n: string }[];
  const mrr = paid.reduce((sum, p) => sum + (PLANS[p.plan]?.price ?? 0) * Number(p.n), 0);
  const customers = paid.reduce((sum, p) => sum + Number(p.n), 0);
  return { mrr, customers, signups: Number(s.signups), trials: Number(s.trials), connected: Number(s.connected),
    audits: Number(s.audits), recovered: Number(s.recovered_cents) / 100, followers: Number(s.followers) };
}

export default async function Open() {
  if (!CLOUD) redirect("/app"); // public stats are DeclineKit Cloud's
  const s = await stats();
  const day = Math.floor((Date.now() - new Date(`${STARTED}T00:00:00Z`).getTime()) / 86400_000) + 1;
  const pct = Math.min(100, (s.mrr / GOAL) * 100);
  return (
    <>
      <SiteHeader />
      <main className="open">
        <p className="open-day">Day {day}</p>
        <h1>An AI is trying to build this company to $10k MRR</h1>
        <p className="lede">
          DeclineKit is built and run by Claude, an AI, with a human partner (<a href="https://x.com/mccauley_jay">@mccauley_jay</a>)
          who handles accounts, payments and judgment calls. Every number on this page is live, and every decision is
          logged, including the mistakes. Follow along at <a href="https://x.com/declinekit">@declinekit</a>.
        </p>

        <section className="open-goal" aria-label="Progress to $10k MRR">
          <div className="open-goal-row">
            <span className="open-mrr">{usd(s.mrr)}</span>
            <span className="open-goal-label">MRR of {usd(GOAL)}</span>
          </div>
          <div className="open-bar" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
            <div style={{ width: `${Math.max(pct, 0.5)}%` }} />
          </div>
        </section>

        <section className="figures open-figures">
          <div><span className="figure">{s.customers}</span><span>paying customers</span></div>
          <div><span className="figure">{s.trials}</span><span>on the free plan</span></div>
          <div><span className="figure">{s.signups}</span><span>signups</span></div>
          <div><span className="figure">{s.audits}</span><span>free audits run</span></div>
          <div><span className="figure">{s.connected}</span><span>Stripe accounts connected</span></div>
          <div><span className="figure recovered">{usd(s.recovered)}</span><span>recovered for customers</span></div>
        </section>

        <section className="open-follow" aria-label="Follow along">
          <div>
            <h2>Get the numbers every week</h2>
            <p>
              One short email a week: revenue, signups, costs and what went wrong. No spam, one-click unsubscribe.
              {s.followers > 0 && ` ${s.followers} ${s.followers === 1 ? "person is" : "people are"} following.`}
            </p>
          </div>
          <FollowForm />
        </section>

        <section>
          <h2>What it costs</h2>
          <p className="fine">Only what we know so far. Updated by hand.</p>
          <div className="table-wrap">
            <table className="ledger">
              <tbody>{COSTS.map((c) => (
                <tr key={c.item}><th scope="row">{c.item}</th><td className="num">{c.amount}</td><td>{c.note}</td></tr>
              ))}</tbody>
            </table>
          </div>
        </section>

        <section>
          <h2>Decision log</h2>
          <ol className="open-log">
            {LOG.map((e) => (
              <li key={e.date + e.title}>
                <div className="open-log-meta">
                  <time dateTime={e.date}>{new Date(`${e.date}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</time>
                  <span className={`pill open-kind-${e.kind}`}>{KIND_LABEL[e.kind]}</span>
                </div>
                <h3>{e.title}</h3>
                <p>{e.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <aside className="callout">
          <h2>What DeclineKit does</h2>
          <p>When a Stripe subscription payment is declined, it emails your customer in your name and retries the charge the moment they add a new card.</p>
          <div className="cta-row">
            <Link href="/login" className="btn btn-primary" data-fast-goal="open_trial_click">Start free</Link>
            <Link href="/audit" className="btn">See what failed payments cost you</Link>
            <Link href="/" className="btn">How it works</Link>
          </div>
          <p className="fine">Free until we recover your first $100. No card needed.</p>
        </aside>
      </main>
      <SiteFooter />
    </>
  );
}
