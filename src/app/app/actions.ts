"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { requireAccount } from "@/lib/auth";
import { signOut } from "@/lib/session";
import { ConnectError, connectStripe, disconnectStripe } from "@/lib/recovery";
import { platform, PLANS, type PlanId } from "@/lib/stripe";
import { appUrl } from "@/lib/format";
import { isEmail, safeName, sendInternal } from "@/lib/email";
import { overLimit } from "@/lib/rate-limit";

export async function connectAction(_: unknown, formData: FormData) {
  const account = await requireAccount();
  if (await overLimit(`connect:${account.id}`, 10, 60)) return { error: "Too many attempts. Try again in an hour." };
  try {
    await connectStripe(account, String(formData.get("key") ?? ""));
  } catch (e) {
    if (e instanceof ConnectError) return { error: e.message };
    console.error(e);
    return { error: "Something went wrong connecting to Stripe. Try again in a minute." };
  }
  revalidatePath("/app");
  return { error: null };
}

export async function setEmailsEnabled(formData: FormData) {
  const account = await requireAccount();
  await sql`UPDATE accounts SET emails_enabled = ${formData.get("enabled") === "on"} WHERE id = ${account.id}`;
  revalidatePath("/app");
}

export async function saveSettings(formData: FormData) {
  const account = await requireAccount();
  const text = (k: string) => String(formData.get(k) ?? "").replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, 80) || null;
  const brand = text("brand_name");
  const fromRaw = text("from_name");
  // The sender name lands in the From header, so it gets the stricter cleanup.
  const from = fromRaw ? safeName(fromRaw) : null;
  const replyTo = String(formData.get("reply_to") ?? "").trim().toLowerCase() || null;
  if (replyTo && (!isEmail(replyTo) || replyTo.length > 120)) redirect("/app/settings?error=reply_to");
  await sql`UPDATE accounts SET brand_name = ${brand}, from_name = ${from}, reply_to = ${replyTo} WHERE id = ${account.id}`;
  // Customer emails go out under these names from our domain, so every change gets a human look.
  if (brand !== account.brand_name || from !== account.from_name || replyTo !== account.reply_to) {
    await sendInternal(`Sender settings changed: ${account.email}`,
      `Product name: ${brand ?? "(none)"}\nSender name: ${from ?? "(none)"}\nReplies to: ${replyTo ?? "(none)"}\nStripe account: ${account.stripe_account_name ?? "not connected"}`);
  }
  redirect("/app/settings?saved=1");
}

export async function disconnectAction() {
  const account = await requireAccount();
  await disconnectStripe(account);
  await sendInternal(`Stripe disconnected: ${account.email}`, "They disconnected from Settings.");
  redirect("/app");
}

// Deletes the account and everything stored about its customers. Cascades to
// failed_invoices, email_log and expiring_reminders.
export async function deleteAccountAction(formData: FormData) {
  const account = await requireAccount();
  if (formData.get("confirm") !== "on") redirect("/app/settings#delete");
  await disconnectStripe(account);
  if (account.billing_subscription_id) {
    try {
      await platform().subscriptions.cancel(account.billing_subscription_id);
    } catch (e) {
      console.error("cancel on delete failed", account.id, e);
    }
  }
  await sql`DELETE FROM accounts WHERE id = ${account.id}`;
  await sendInternal(`Account deleted: ${account.email}`, "Deleted from Settings, with all customer records.");
  await signOut();
  redirect("/");
}

export async function subscribe(formData: FormData) {
  const account = await requireAccount();
  const plan = String(formData.get("plan")) as PlanId;
  const price = PLANS[plan] && process.env[PLANS[plan].env];
  if (!price) throw new Error("Unknown plan");
  // DataFast revenue attribution: ties the purchase to the visitor's marketing channel.
  const jar = await cookies();
  const datafast: Record<string, string> = {};
  for (const k of ["datafast_visitor_id", "datafast_session_id"]) {
    const v = jar.get(k)?.value;
    if (v) datafast[k] = v;
  }
  const session = await platform().checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price, quantity: 1 }],
    client_reference_id: account.id,
    ...(account.billing_customer_id ? { customer: account.billing_customer_id } : { customer_email: account.email }),
    allow_promotion_codes: true,
    metadata: datafast,
    subscription_data: { billing_mode: { type: "flexible" }, metadata: datafast },
    success_url: `${appUrl()}/app?subscribed=1`,
    cancel_url: `${appUrl()}/app/settings`,
  });
  redirect(session.url!);
}

export async function openPortal() {
  const account = await requireAccount();
  if (!account.billing_customer_id) redirect("/app/settings");
  const s = await platform().billingPortal.sessions.create({
    customer: account.billing_customer_id,
    return_url: `${appUrl()}/app/settings`,
  });
  redirect(s.url);
}

export async function logout() {
  await signOut();
  redirect("/");
}
