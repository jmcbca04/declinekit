import nodemailer from "nodemailer";
import { money } from "./format";

// Addresses are <role>@DOMAIN (billing@, alerts@, login@...). MAIL_DOMAIN is the domain you send
// from; on Mailgun it's also the sending domain in the API path.
const DOMAIN = process.env.MAIL_DOMAIN ?? process.env.MAILGUN_DOMAIN ?? "mg.declinekit.com";
const API = process.env.MAILGUN_API_BASE ?? "https://api.mailgun.net";

export const isEmail = (s: string) => /^[^\s@<>",;:\\]+@[^\s@<>",;:\\]+\.[^\s@<>",;:\\]+$/.test(s);

// Account-controlled display names go into the From header, so strip anything that
// could smuggle in another address or header, and always quote what's left.
export function safeName(name: string) {
  const clean = name.replace(/[\u0000-\u001f\u007f"<>@\\,;:]/g, "").replace(/\s+/g, " ").trim().slice(0, 60);
  return clean || "Billing";
}

type Message = { from: string; to: string; subject: string; text: string; replyTo?: string | null; deliverAt?: Date };

// Two transports: Mailgun's HTTP API when MAILGUN_API_KEY is set (DeclineKit Cloud), otherwise
// any SMTP server via SMTP_URL, e.g. smtp://user:pass@smtp.example.com:587 (self-hosted).
let smtp: nodemailer.Transporter | null = null;
async function send(m: Message) {
  if (!process.env.MAILGUN_API_KEY) {
    if (!process.env.SMTP_URL) throw new Error("No email transport: set MAILGUN_API_KEY or SMTP_URL");
    smtp ??= nodemailer.createTransport(process.env.SMTP_URL);
    // SMTP can't schedule; anything with deliverAt just goes out now.
    const info = await smtp.sendMail({ from: m.from, to: m.to, subject: m.subject, text: m.text, replyTo: m.replyTo && isEmail(m.replyTo) ? m.replyTo : undefined });
    return info.messageId ?? null;
  }
  const body = new URLSearchParams({ from: m.from, to: m.to, subject: m.subject, text: m.text });
  if (m.replyTo && isEmail(m.replyTo)) body.set("h:Reply-To", m.replyTo);
  if (m.deliverAt) body.set("o:deliverytime", m.deliverAt.toUTCString()); // Mailgun holds it until then
  const res = await fetch(`${API}/v3/${DOMAIN}/messages`, {
    method: "POST",
    headers: { Authorization: `Basic ${Buffer.from(`api:${process.env.MAILGUN_API_KEY}`).toString("base64")}` },
    body,
  });
  if (!res.ok) throw new Error(`Mailgun ${res.status}: ${await res.text()}`);
  return ((await res.json()) as { id?: string }).id ?? null;
}

export async function sendInternal(subject: string, text: string) {
  const to = process.env.FOUNDER_EMAIL;
  if (!to) return;
  try {
    await send({ from: `DeclineKit <alerts@${DOMAIN}>`, to, subject, text });
  } catch (e) {
    console.error("internal alert failed", e);
  }
}

// Sign-in code for the built-in login (self-hosted). Cloud's codes are sent by Neon Auth.
export function sendLoginCode(to: string, code: string) {
  return send({
    from: `DeclineKit <login@${DOMAIN}>`,
    to,
    subject: `Your DeclineKit sign-in code: ${code}`,
    text: `Your sign-in code is ${code}\n\nIt expires in 10 minutes. If you didn't try to sign in, you can ignore this email.`,
  });
}

// Welcome note from Jay, scheduled ~10 minutes after signup so it reads like a person, not a receipt.
// `connecting` is true when they signed up from the Stripe App's "Finish setup" link, which
// connects Stripe for them, so the "connect Stripe" step is left out.
export function welcomeCopy(connecting: boolean) {
  const steps = connecting
    ? `Your Stripe account is connected, so you're two steps from your first recovered payment:
1. Preview the four recovery emails and set your sender name and reply-to address
2. Switch recovery on. DeclineKit picks up any payment that's failing right now.`
    : `Getting to your first recovered payment takes about five minutes:
1. Connect Stripe: https://declinekit.com/app
2. Preview the four recovery emails, set your sender name and reply-to address
3. Switch recovery on. DeclineKit picks up any payment that's failing right now.`;
  return {
    subject: "Your first recovery with DeclineKit",
    body: `Hi, Jay here. Thanks for signing up for DeclineKit.

${steps}

It's free until it recovers your first $100 (or 60 days), and nothing is charged automatically after that.

One question: how did you find us? Hit reply, it comes straight to me.

Jay`,
  };
}

export async function sendWelcome(to: string, connecting: boolean) {
  const { subject, body } = welcomeCopy(connecting);
  try {
    await send({
      from: "Jay at DeclineKit <hello@declinekit.com>", to, replyTo: "hello@declinekit.com",
      subject, text: body, deliverAt: new Date(Date.now() + 10 * 60_000),
    });
  } catch (e) {
    console.error("welcome email failed", e);
  }
}

// Sent to a DeclineKit customer once their free allowance is used up by real recoveries.
export function sendFreeLimitReached(to: string, recovered: string) {
  return send({
    from: `DeclineKit <billing@${DOMAIN}>`,
    to,
    subject: `DeclineKit has recovered ${recovered} for you`,
    text: `Good news: customers have paid ${recovered} in failed renewals through DeclineKit's card-update links, so your free period is complete.\n\nTo keep recovering, pick a plan (from $29/month): https://declinekit.com/app/settings#plans\n\nUntil then, recovery emails are paused. Nothing is charged automatically.`,
  });
}

// Sent when someone follows the experiment from /open.
export function sendFollowWelcome(to: string, unsubscribeUrl: string) {
  return send({
    from: `DeclineKit <updates@${DOMAIN}>`,
    to,
    subject: "You're following DeclineKit",
    text: `Thanks for following along.\n\nDeclineKit is a SaaS built and run by an AI (Claude), with a human partner, trying to reach $10k MRR in public. Once a week you'll get the real numbers: revenue, signups, costs, and what went wrong.\n\nLive numbers any time: https://declinekit.com/open\n\nNot for you? Unsubscribe with one click: ${unsubscribeUrl}`,
  });
}

type DunningInput = {
  step: number;
  brand: string;
  fromName: string;
  replyTo: string | null;
  to: string;
  customerName: string | null;
  amountCents: number;
  currency: string;
  link: string;
};

// Four emails over ~12 days. Plain text on purpose: it reads like a person wrote it,
// lands in the primary inbox more often, and is what the best dunning tools converge on.
export function dunningCopy(i: Omit<DunningInput, "to" | "fromName" | "replyTo">) {
  const hi = i.customerName ? `Hi ${i.customerName.split(" ")[0]},` : "Hi there,";
  const amt = money(i.amountCents, i.currency);
  const copy = [
    {
      subject: `Your ${i.brand} payment didn't go through`,
      body: `${hi}\n\nWe tried to charge your card for your ${i.brand} subscription (${amt}) and the payment was declined. This happens all the time: an expired card, a new card number, or a bank being cautious.\n\nYou can update your card in under a minute here:\n${i.link}\n\nYour account is still active. Just reply to this email if anything's unclear.`,
    },
    {
      subject: `Quick reminder: update your card for ${i.brand}`,
      body: `${hi}\n\nJust a reminder that your ${i.brand} payment of ${amt} still hasn't gone through.\n\nUpdate your card here and we'll take care of the rest:\n${i.link}\n\nThanks!`,
    },
    {
      subject: `Your ${i.brand} subscription is at risk`,
      body: `${hi}\n\nWe still haven't been able to collect ${amt} for your ${i.brand} subscription. If the payment keeps failing, your subscription will be cancelled automatically.\n\nUpdate your card here:\n${i.link}\n\nIf you meant to cancel, no action is needed. And if something's wrong, reply and let us know.`,
    },
    {
      subject: `Final notice: your ${i.brand} subscription will be cancelled`,
      body: `${hi}\n\nThis is the last reminder. Your ${i.brand} payment of ${amt} is still outstanding, and your subscription will be cancelled soon.\n\nTo keep your account, update your card here:\n${i.link}\n\nThanks for being a customer.`,
    },
  ];
  return copy[Math.min(i.step, copy.length - 1)];
}

export const DUNNING_STEPS = 4;
// Days after failure that each step is sent. Step 0 waits an hour so Stripe's
// own immediate retry has a chance to succeed first.
export const STEP_OFFSET_HOURS = [1, 72, 168, 288];

export async function sendDunningEmail(i: DunningInput) {
  const { subject, body } = dunningCopy(i);
  return send({ from: `"${safeName(i.fromName)}" <billing@${DOMAIN}>`, to: i.to, replyTo: i.replyTo, subject, text: body });
}

type ExpiringInput = {
  brand: string;
  customerName: string | null;
  cardBrand: string;
  last4: string;
  expires: Date;
  renewsOn: Date;
  link: string;
};

// Sent once per card, before it expires, so the renewal never fails in the first place.
export function expiringCopy(i: ExpiringInput) {
  const hi = i.customerName ? `Hi ${i.customerName.split(" ")[0]},` : "Hi there,";
  const card = `${i.cardBrand.charAt(0).toUpperCase()}${i.cardBrand.slice(1)} ending in ${i.last4}`;
  const month = i.expires.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
  const renews = i.renewsOn.toLocaleDateString("en-US", { month: "long", day: "numeric", timeZone: "UTC" });
  return {
    subject: `Your card for ${i.brand} expires soon`,
    body: `${hi}\n\nThe card on your ${i.brand} subscription (${card}) expires at the end of ${month}, before your next payment on ${renews}.\n\nTo keep everything running without interruption, add your new card here:\n${i.link}\n\nIt takes under a minute. If you've already updated it, you can ignore this email.`,
  };
}

export async function sendExpiringEmail(i: ExpiringInput & { to: string; fromName: string; replyTo: string | null }) {
  const { subject, body } = expiringCopy(i);
  return send({ from: `"${safeName(i.fromName)}" <billing@${DOMAIN}>`, to: i.to, replyTo: i.replyTo, subject, text: body });
}
