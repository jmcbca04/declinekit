"use client";
import Script from "next/script";
import { usePathname } from "next/navigation";

// Card-update pages (/u, /c) are for our customers' customers, and their URLs carry
// private tokens, so they never load analytics.
const UNTRACKED = /^\/(u|c)\//;

export function Analytics() {
  const pathname = usePathname();
  if (UNTRACKED.test(pathname)) return null;
  return (
    <Script
      src="https://datafa.st/js/script.js"
      data-website-id="dfid_9YzQ87zQjYOkpupmmRX2f"
      data-domain="declinekit.com"
      strategy="afterInteractive"
    />
  );
}
