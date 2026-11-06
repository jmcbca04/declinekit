"use server";
import { redirect } from "next/navigation";
import { sendCode, verifyCode } from "@/lib/session";
import { ensureAccount } from "@/lib/auth";
import { clientIp, overLimit } from "@/lib/rate-limit";

type State = { step: "email" | "code"; email: string; error: string | null };

export async function loginAction(prev: State, formData: FormData): Promise<State> {
  if (formData.get("intent") === "restart") return { step: "email", email: "", error: null };

  if (prev.step === "email") {
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ...prev, error: "Enter a valid email address." };
    // Stops the form being used to flood someone's inbox with codes.
    if (await overLimit(`otp:${email}`, 5, 60) || await overLimit(`otp-ip:${await clientIp()}`, 10, 60)) {
      return { ...prev, email, error: "Too many codes requested. Try again in an hour." };
    }
    const { ok } = await sendCode(email);
    if (!ok) return { ...prev, email, error: "We couldn't send a code to that address. Try again in a minute." };
    return { step: "code", email, error: null };
  }

  const otp = String(formData.get("otp") ?? "").replace(/\s/g, "");
  const result = await verifyCode(prev.email, otp, async (user) => (await ensureAccount(user)).id);
  if (!result.ok) {
    const msg = result.tooMany
      ? "Too many attempts. Request a new code."
      : "That code is wrong or has expired.";
    return { ...prev, error: msg };
  }
  redirect("/app");
}
