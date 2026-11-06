import type { MetadataRoute } from "next";
import { ALTERNATIVES } from "@/lib/alternatives";
import { DECLINE_CODES } from "@/lib/decline-codes";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.APP_URL ?? "https://declinekit.com";
  return ["", "/audit", "/open", "/failed-payment-calculator", "/dunning-email-templates", "/guides/stripe-failed-payments", "/guides/stripe-smart-retries-vs-dunning-emails", "/for/ghost", "/for/beehiiv", "/for/mobile-apps", ...ALTERNATIVES.map((a) => `/alternatives/${a.slug}`), "/decline-codes", ...DECLINE_CODES.map((c) => `/decline-codes/${c.code}`), "/privacy", "/terms"]
    .map((p) => ({ url: `${base}${p}` }));
}
