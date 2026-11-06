"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { FIRST_TOUCH_COOKIE, PAGES_COOKIE } from "@/lib/first-touch";

// Remembers how a visitor first found the site (referring site, landing page, campaign tags)
// and the last few pages they viewed, so a new signup's alert can say where they came from.
// First-party cookies only; nothing here is sent anywhere until the visitor signs up.
const MAX_AGE = 60 * 60 * 24 * 90;
const SKIP = /^\/(u|c|app|api)(\/|$)/; // private token pages and the signed-in app
const KEEP_PARAMS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "ref", "source", "via"];

function readCookie(name: string) {
  return document.cookie.split("; ").find((c) => c.startsWith(`${name}=`))?.slice(name.length + 1);
}

function writeCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${MAX_AGE}; Path=/; SameSite=Lax; Secure`;
}

export function FirstTouch() {
  const pathname = usePathname();
  useEffect(() => {
    if (SKIP.test(pathname)) return;
    try {
      if (!readCookie(FIRST_TOUCH_COOKIE)) {
        let referrer = "";
        if (document.referrer) {
          const r = new URL(document.referrer);
          if (r.hostname !== location.hostname) referrer = `${r.hostname}${r.pathname}`.slice(0, 120);
        }
        const params = new URLSearchParams(location.search);
        const tags = KEEP_PARAMS.filter((k) => params.get(k)).map((k) => `${k}=${params.get(k)!.slice(0, 60)}`);
        writeCookie(FIRST_TOUCH_COOKIE, JSON.stringify({ r: referrer, l: pathname.slice(0, 120), q: tags.join("&"), t: new Date().toISOString() }));
      }
      const raw = readCookie(PAGES_COOKIE);
      const pages: string[] = raw ? JSON.parse(decodeURIComponent(raw)) : [];
      if (pages[pages.length - 1] !== pathname) pages.push(pathname.slice(0, 80));
      writeCookie(PAGES_COOKIE, JSON.stringify(pages.slice(-12)));
    } catch {
      // Cookies blocked or malformed: the alert just says less.
    }
  }, [pathname]);
  return null;
}
