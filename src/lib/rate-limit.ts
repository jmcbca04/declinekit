import { headers } from "next/headers";
import { sql } from "./db";
import { sha256 } from "./crypto";

// Records a hit and reports whether `key` already had `max` hits in the window.
// Postgres-backed fixed window: plenty for our traffic, and no extra service to run.
export async function overLimit(key: string, max: number, windowMinutes: number) {
  const k = sha256(key);
  const [r] = await sql`
    WITH hit AS (INSERT INTO rate_limit_hits (key) VALUES (${k}))
    SELECT count(*)::int AS n FROM rate_limit_hits
    WHERE key = ${k} AND hit_at > now() - make_interval(mins => ${windowMinutes})`;
  return (r.n as number) >= max;
}

export async function pruneRateLimits() {
  await sql`DELETE FROM rate_limit_hits WHERE hit_at < now() - interval '1 day'`;
}

// Vercel sets x-forwarded-for itself, so the first entry is the real client.
export async function clientIp() {
  return (await headers()).get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
}
