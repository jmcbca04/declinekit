import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { isActive, recoveredCents, type Account } from "@/lib/auth";
import { sendExpiringReminders } from "@/lib/expiring";

export const maxDuration = 300;

export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("unauthorized", { status: 401 });
  }
  const accounts = (await sql`SELECT * FROM accounts WHERE emails_enabled AND (stripe_key_enc IS NOT NULL OR stripe_connection = 'app')`) as Account[];
  let sent = 0;
  for (const account of accounts) {
    if (!isActive(account, await recoveredCents(account.id))) continue;
    try {
      sent += await sendExpiringReminders(account);
    } catch (e) {
      console.error("expiring scan failed", account.id, e);
    }
  }
  return NextResponse.json({ accounts: accounts.length, sent });
}
