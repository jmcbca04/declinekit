"use client";
import { useActionState } from "react";
import { connectAction } from "./actions";

export function ConnectForm() {
  const [state, action, pending] = useActionState(connectAction, { error: null as string | null });
  return (
    <form action={action} className="stack">
      <label htmlFor="key">Restricted key</label>
      <input id="key" name="key" required placeholder="rk_live_…" autoComplete="off" spellCheck={false} className="mono" />
      {state.error && <p className="error">{state.error}</p>}
      <button className="btn btn-primary" disabled={pending}>{pending ? "Connecting…" : "Connect Stripe"}</button>
    </form>
  );
}
