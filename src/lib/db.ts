import { neon } from "@neondatabase/serverless";
import postgres from "postgres";

// One tagged-template query function, two drivers:
// - Neon's serverless HTTP driver when DATABASE_URL points at Neon (DeclineKit Cloud on Vercel),
// - postgres.js for any other Postgres (self-hosted, Docker, local development).
// Both return an array of row objects; queries never nest fragments, so they behave the same.
// DB_DRIVER=neon|postgres overrides the choice. The client is created on first use, so builds
// don't need a database.
type Rows = any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
type Sql = (strings: TemplateStringsArray, ...values: unknown[]) => Promise<Rows>;

let client: Sql | null = null;

function connect(): Sql {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const useNeon = process.env.DB_DRIVER ? process.env.DB_DRIVER === "neon" : new URL(url).hostname.endsWith(".neon.tech");
  if (useNeon) return neon(url) as unknown as Sql;
  const pg = postgres(url, { max: 5, transform: { undefined: null }, onnotice: () => {} });
  return (strings, ...values) => pg(strings, ...(values as never[])) as unknown as Promise<Rows>;
}

export const sql: Sql = (strings, ...values) => (client ??= connect())(strings, ...values);
