export function money(cents: number | string | null | undefined, currency = "usd") {
  const n = Number(cents ?? 0) / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: n >= 1000 ? 0 : 2,
  }).format(n);
}

export const appUrl = () => (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
