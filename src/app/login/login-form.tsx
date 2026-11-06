"use client";
import { useActionState } from "react";
import { loginAction } from "./actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, { step: "email", email: "", error: null });
  if (state.step === "code") {
    return (
      <form action={action} className="stack">
        <h1>Check your inbox</h1>
        <p className="lede">We sent a 6-digit code to {state.email}.</p>
        <label htmlFor="otp">Sign-in code</label>
        <input id="otp" name="otp" required inputMode="numeric" autoComplete="one-time-code" pattern="[0-9 ]{6,7}" maxLength={7} className="mono otp" autoFocus />
        {state.error && <p className="error">{state.error}</p>}
        <button className="btn btn-primary" disabled={pending}>{pending ? "Signing in…" : "Sign in"}</button>
        <button className="link-button" name="intent" value="restart" formNoValidate>Use a different email</button>
      </form>
    );
  }
  return (
    <form action={action} className="stack">
      <h1>Sign in or start free</h1>
      <p className="lede">We&rsquo;ll email you a sign-in code. No password, no card.</p>
      <label htmlFor="email">Work email</label>
      <input id="email" name="email" type="email" required autoComplete="email" placeholder="you@company.com" defaultValue={state.email} />
      {state.error && <p className="error">{state.error}</p>}
      <button className="btn btn-primary" disabled={pending}>{pending ? "Sending…" : "Email me a code"}</button>
    </form>
  );
}
