import Link from "next/link";
import { notFound } from "next/navigation";
import { DECLINE_CODES, findCode } from "@/lib/decline-codes";
import { SiteFooter, SiteHeader } from "../../site-chrome";

export const dynamicParams = false;
export const generateStaticParams = () => DECLINE_CODES.map((c) => ({ code: c.code }));

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }) {
  const c = findCode((await params).code);
  if (!c) return {};
  return {
    title: `Stripe "${c.code}" decline code: what it means and how to fix it | DeclineKit`,
    description: `${c.meaning} Here's whether retrying helps and what to tell your customer.`,
    alternates: { canonical: `/decline-codes/${c.code}` },
  };
}

const RETRY_ANSWER = {
  yes: "Usually, yes. This is a temporary decline, so a retry a few days later often succeeds.",
  sometimes: "Sometimes. Retry a couple of times over several days, but email the customer in parallel.",
  no: "No. The same card will keep failing. You need the customer to give you a new payment method.",
};

export default async function Code({ params }: { params: Promise<{ code: string }> }) {
  const c = findCode((await params).code);
  if (!c) notFound();
  const others = DECLINE_CODES.filter((o) => o.code !== c.code).slice(0, 8);
  return (
    <>
      <SiteHeader />
      <main className="prose">
        <p><Link href="/decline-codes">All decline codes</Link></p>
        <h1><span className="mono code-heading">{c.code}</span></h1>
        <p className="lede">{c.title}. {c.meaning}</p>
        <h2>Will retrying the charge work?</h2>
        <p>{RETRY_ANSWER[c.retry]}</p>
        <h2>What to do about it</h2>
        <p>{c.action}</p>
        <h2>What to tell your customer</h2>
        <blockquote>{c.tellCustomer}</blockquote>
        <aside className="callout">
          <h2>Handle this automatically</h2>
          <p>
            DeclineKit watches your Stripe account for failed subscription payments, emails the customer a one-click
            card update link, and retries the charge the moment they do. Plans start at $29/month.
          </p>
          <Link href="/audit" className="btn btn-primary">See what declines cost you: free audit</Link>
        </aside>
        <h2>Other decline codes</h2>
        <ul className="code-links">
          {others.map((o) => <li key={o.code}><Link href={`/decline-codes/${o.code}`} className="mono">{o.code}</Link></li>)}
        </ul>
      </main>
      <SiteFooter />
    </>
  );
}
