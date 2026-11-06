// Sets up or upgrades the database: `npm run migrate` (uses DATABASE_URL).
// Empty database -> applies db/schema.sql and records every migration as applied.
// Existing database -> applies, in order, each db/migrations/*.sql not yet recorded.
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
// DeclineKit Cloud's database predates this runner; its migrations are applied by hand.
if (process.env.DECLINEKIT_CLOUD === "true") {
  console.log("DeclineKit Cloud: skipping migrations.");
  process.exit(0);
}
const url = process.env.DATABASE_URL;
if (!url) {
  // On a first Vercel deploy the database may not be connected yet. Don't fail the build:
  // connect Postgres and redeploy, and the tables are created then.
  console.warn("DATABASE_URL is not set: skipping migrations. Connect a database and redeploy.");
  process.exit(process.env.VERCEL ? 0 : 1);
}
const sql = postgres(url, { max: 1, onnotice: () => {} });
const dir = join(root, "db", "migrations");
const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();

try {
  const [{ fresh, tracked }] = await sql`SELECT to_regclass('public.accounts') IS NULL AS fresh,
                                                 to_regclass('public.schema_migrations') IS NOT NULL AS tracked`;
  if (!fresh && !tracked) {
    // Tables exist but this runner never set them up: don't guess which migrations they have.
    console.error("This database has DeclineKit tables but no schema_migrations table, so it wasn't set up by this script. Apply db/migrations by hand.");
    process.exit(1);
  }
  await sql`CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())`;
  if (fresh) {
    await sql.begin(async (tx) => {
      await tx.unsafe(readFileSync(join(root, "db", "schema.sql"), "utf8"));
      for (const f of files) await tx`INSERT INTO schema_migrations (name) VALUES (${f}) ON CONFLICT DO NOTHING`;
    });
    console.log(`Created schema (${files.length} migrations marked as applied).`);
  } else {
    const done = new Set((await sql`SELECT name FROM schema_migrations`).map((r) => r.name));
    const pending = files.filter((f) => !done.has(f));
    for (const f of pending) {
      await sql.begin(async (tx) => {
        await tx.unsafe(readFileSync(join(dir, f), "utf8"));
        await tx`INSERT INTO schema_migrations (name) VALUES (${f})`;
      });
      console.log(`Applied ${f}`);
    }
    console.log(pending.length ? "Database is up to date." : "Nothing to apply.");
  }
} finally {
  await sql.end();
}
