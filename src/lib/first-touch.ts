// Cookie names shared by the client tracker (src/app/first-touch.tsx) and the signup alert.
export const FIRST_TOUCH_COOKIE = "dk_ft";
export const PAGES_COOKIE = "dk_pv";

type FirstTouch = { r?: string; l?: string; q?: string; t?: string };

const parse = <T,>(raw: string | undefined): T | null => {
  if (!raw) return null;
  try { return JSON.parse(decodeURIComponent(raw)) as T; } catch { return null; }
};

// Plain-text summary for the founder's "New signup" alert.
export function describeVisit(cookieValue: (name: string) => string | undefined, header: (name: string) => string | null) {
  const ft = parse<FirstTouch>(cookieValue(FIRST_TOUCH_COOKIE));
  const pages = parse<string[]>(cookieValue(PAGES_COOKIE)) ?? [];
  const city = header("x-vercel-ip-city");
  const country = header("x-vercel-ip-country");
  const where = [city ? decodeURIComponent(city) : null, country].filter(Boolean).join(", ");
  const lines = [
    `Came from: ${ft ? (ft.r || "direct (no referrer: typed, bookmark, or an app like X/Slack/email)") : "unknown (no first-visit cookie)"}`,
    ft?.q ? `Campaign tags: ${ft.q}` : null,
    ft?.l ? `First page: ${ft.l}` : null,
    ft?.t ? `First visit: ${ft.t}` : null,
    pages.length ? `Pages before signup: ${pages.join(" → ")}` : null,
    where ? `Location: ${where}` : null,
  ];
  return lines.filter(Boolean).join("\n");
}
