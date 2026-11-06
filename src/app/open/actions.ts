"use server";
import { sql } from "@/lib/db";
import { randomToken } from "@/lib/crypto";
import { isEmail, sendFollowWelcome, sendInternal } from "@/lib/email";
import { appUrl } from "@/lib/format";
import { clientIp, overLimit } from "@/lib/rate-limit";

export type FollowState = { done: boolean; error: string | null };

export async function followAction(_: FollowState, formData: FormData): Promise<FollowState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!isEmail(email) || email.length > 200) return { done: false, error: "Enter a valid email address." };
  if (await overLimit(`follow:${await clientIp()}`, 5, 60)) return { done: false, error: "Too many tries. Try again in an hour." };

  // Re-following after an unsubscribe switches updates back on.
  const [row] = await sql`
    INSERT INTO subscribers (email, unsubscribe_token, source) VALUES (${email}, ${randomToken(18)}, 'open')
    ON CONFLICT (email) DO UPDATE SET unsubscribed_at = NULL
    RETURNING unsubscribe_token, (xmax = 0) AS created`;
  if (row.created) {
    try {
      await sendFollowWelcome(email, `${appUrl()}/unsubscribe/${row.unsubscribe_token}`);
    } catch (e) {
      console.error("follow welcome failed", e);
    }
    await sendInternal(`New follower: ${email}`, "Signed up for weekly updates on /open.");
  }
  return { done: true, error: null };
}
