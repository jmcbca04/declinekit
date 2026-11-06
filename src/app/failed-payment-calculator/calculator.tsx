"use client";
import Link from "next/link";
import { useState } from "react";

function Field({ id, label, hint, value, onChange, suffix }: {
  id: string; label: string; hint: string; value: number; onChange: (n: number) => void; suffix?: string;
}) {
  return (
    <div className="calc-field">
      <label htmlFor={id}>{label}</label>
      <div className="calc-input">
        {!suffix && <span>$</span>}
        <input id={id} type="number" inputMode="decimal" min={0} value={Number.isFinite(value) ? value : ""}
          onChange={(e) => onChange(parseFloat(e.target.value))} />
        {suffix && <span>{suffix}</span>}
      </div>
      <p className="fine">{hint}</p>
    </div>
  );
}

export function Calculator() {
  const [mrr, setMrr] = useState(20000);
  const [failRate, setFailRate] = useState(5);
  const [retryRate, setRetryRate] = useState(35);
  const [winBack, setWinBack] = useState(40);

  const safe = (n: number) => (Number.isFinite(n) && n > 0 ? n : 0);
  const failedMonthly = safe(mrr) * (safe(failRate) / 100);
  const lostMonthly = failedMonthly * (1 - Math.min(safe(retryRate), 100) / 100);
  const recoverableMonthly = lostMonthly * (Math.min(safe(winBack), 100) / 100);
  const c = (dollars: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(dollars);

  return (
    <div className="calc">
      <div className="calc-inputs">
        <Field id="mrr" label="Monthly recurring revenue" hint="Your current MRR." value={mrr} onChange={setMrr} />
        <Field id="fail" label="Share of charges that fail" hint="Check Stripe's revenue recovery page for your real number." value={failRate} onChange={setFailRate} suffix="%" />
        <Field id="retry" label="Recovered by retries alone" hint="How much Stripe's retries already win back." value={retryRate} onChange={setRetryRate} suffix="%" />
        <Field id="win" label="Won back by card-update emails" hint="Of what's left. We use a conservative 40%." value={winBack} onChange={setWinBack} suffix="%" />
      </div>
      <div className="calc-out" aria-live="polite">
        <p className="audit-caption">Lost to declined cards each month, after retries</p>
        <p className="audit-figure failed">{c(lostMonthly)}</p>
        <dl className="audit-breakdown">
          <div><dt>Lost per year</dt><dd>{c(lostMonthly * 12)}</dd></div>
          <div><dt>Recoverable per month with card-update emails</dt><dd className="recovered">{c(recoverableMonthly)}</dd></div>
          <div><dt>Recoverable per year</dt><dd className="recovered">{c(recoverableMonthly * 12)}</dd></div>
        </dl>
        <p className="fine">These are estimates from your inputs. The free audit reads your real Stripe numbers instead.</p>
        <div className="cta-row">
          <Link href="/audit" className="btn btn-primary">Get your real number</Link>
          <Link href="/login" className="btn">Start free</Link>
        </div>
      </div>
    </div>
  );
}
