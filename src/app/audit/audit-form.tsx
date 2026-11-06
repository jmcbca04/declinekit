"use client";
import Link from "next/link";
import { useActionState, useEffect } from "react";
import { auditAction, type AuditState } from "./actions";
import { money } from "@/lib/format";

export function AuditForm() {
  const [state, action, pending] = useActionState(auditAction, { result: null, error: null } as AuditState);
  const r = state.result;
  useEffect(() => {
    if (r) (window as unknown as { datafast?: (goal: string) => void }).datafast?.("audit_completed");
  }, [r]);

  if (r) {
    const yearly = r.recoverableCents * 4;
    return (
      <div className="audit-result" aria-live="polite">
        {r.failedCount === 0 ? (
          <>
            <h2>No unpaid failed invoices in the last 90 days.</h2>
            <p>Your customers&rsquo; cards are in good shape. Bookmark this page and check again next quarter.</p>
          </>
        ) : (
          <>
            <p className="audit-figure failed">{money(r.failedCents, r.currency)}</p>
            <p className="audit-caption">
              in subscription payments failed and were never collected over the last 90 days, across{" "}
              {r.failedCount} invoice{r.failedCount === 1 ? "" : "s"} and {r.customers} customer{r.customers === 1 ? "" : "s"}.
            </p>
            <dl className="audit-breakdown">
              <div><dt>Likely recoverable with card-update emails</dt><dd className="recovered">{money(r.recoverableCents, r.currency)}</dd></div>
              <div><dt>Same rate over a year</dt><dd>{money(yearly, r.currency)}</dd></div>
              <div><dt>Already recovered by Stripe&rsquo;s retries</dt><dd>{money(r.retriedCents, r.currency)}</dd></div>
            </dl>
            <p className="fine">
              &ldquo;Likely recoverable&rdquo; assumes 40% of failed payments come back once customers are asked to update
              their card, the low end of what dunning tools report.
            </p>
            <Link href="/login" className="btn btn-primary btn-lg">Start recovering it: free until your first $100</Link>
          </>
        )}
      </div>
    );
  }

  return (
    <form action={action} className="stack audit-form">
      <label htmlFor="key">Restricted key with Read access to Invoices</label>
      <input id="key" name="key" required placeholder="rk_live_…" autoComplete="off" spellCheck={false} className="mono" />
      <label htmlFor="email">Email (optional, if you&rsquo;d like a copy)</label>
      <input id="email" name="email" type="email" placeholder="you@company.com" />
      {state.error && <p className="error">{state.error}</p>}
      <button className="btn btn-primary btn-lg" disabled={pending} data-fast-goal="audit_submit">{pending ? "Reading 90 days of invoices…" : "Run the audit"}</button>
      <p className="fine audit-alt">
        Not ready to paste a key? <Link href="/failed-payment-calculator" data-fast-goal="audit_to_calculator">Estimate it with the calculator</Link> instead.
      </p>
    </form>
  );
}
