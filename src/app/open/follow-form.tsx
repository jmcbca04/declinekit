"use client";
import { useActionState } from "react";
import { followAction, type FollowState } from "./actions";

export function FollowForm() {
  const [state, action, pending] = useActionState(followAction, { done: false, error: null } as FollowState);
  if (state.done) {
    return <p className="ok" aria-live="polite">You&rsquo;re in. The first update arrives next week. Check your inbox for a welcome email.</p>;
  }
  return (
    <form action={action} className="follow-form">
      <label htmlFor="follow-email" className="sr-only">Email</label>
      <input id="follow-email" name="email" type="email" required placeholder="you@company.com" autoComplete="email" />
      <button className="btn btn-primary" disabled={pending} data-fast-goal="follow">{pending ? "Adding you…" : "Get the weekly numbers"}</button>
      {state.error && <p className="error">{state.error}</p>}
    </form>
  );
}
