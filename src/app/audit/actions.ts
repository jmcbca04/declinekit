"use server";
import { sql } from "@/lib/db";
import { runAudit, type AuditResult } from "@/lib/recovery";
import { sendInternal } from "@/lib/email";
import { money } from "@/lib/format";
import { clientIp, overLimit } from "@/lib/rate-limit";

export type AuditState = { result: AuditResult | null; error: string | null };

export async function auditAction(_: AuditState, formData: FormData): Promise<AuditState> {
  const key = String(formData.get("key") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase() || null;
  // Restricted keys only: we never want anyone pasting a full secret key into a form.
  if (!/^rk_(live|test)_/.test(key)) return { result: null, error: "Paste a restricted key. It starts with rk_live_. Never paste your secret key." };
  if (await overLimit(`audit:${await clientIp()}`, 5, 60) || await overLimit("audit:all", 60, 60)) {
    return { result: null, error: "Too many audits from here. Try again in an hour." };
  }
  try {
    const result = await runAudit(key);
    await sql`INSERT INTO audits (email, failed_cents, recoverable_cents, failed_count, currency)
              VALUES (${email}, ${result.failedCents}, ${result.recoverableCents}, ${result.failedCount}, ${result.currency})`;
    await sendInternal(`Audit run: ${money(result.failedCents, result.currency)} failed`, `email: ${email ?? "none"}\n${JSON.stringify(result)}`);
    return { result, error: null };
  } catch {
    // One message for every failure, so the form can't be used to test whether a key works.
    return { result: null, error: "That didn't work. Check you copied the whole key and that it has Read access to Invoices." };
  }
}
