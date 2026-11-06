import { cookies } from "next/headers";
import { randomInt } from "node:crypto";
import { sql } from "./db";
import { randomToken, sha256 } from "./crypto";
import { sendLoginCode } from "./email";
import { neonAuth, neonAuthEnabled } from "./neon-auth";
import { overLimit } from "./rate-limit";

// Sign-in by emailed 6-digit code. Two backends behind one interface:
// - Neon Auth when NEON_AUTH_BASE_URL is set (DeclineKit Cloud),
// - a small built-in implementation otherwise (self-hosted): codes in `login_tokens`,
//   sessions in `sessions`, both stored only as sha256 hashes.

export type SessionUser = { id: string; email: string };

const SESSION_COOKIE = "dk_session";
const SESSION_DAYS = 30;
const CODE_MINUTES = 10;
const secureCookies = () => (process.env.APP_URL ?? "").startsWith("https://");

export async function sendCode(email: string): Promise<{ ok: boolean }> {
  if (neonAuthEnabled()) {
    const { error } = await neonAuth().emailOtp.sendVerificationOtp({ email, type: "sign-in" });
    return { ok: !error };
  }
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  await sql`DELETE FROM login_tokens WHERE email = ${email} AND used_at IS NULL`;
  await sql`INSERT INTO login_tokens (token_hash, email, expires_at)
            VALUES (${sha256(`${email}:${code}`)}, ${email}, now() + make_interval(mins => ${CODE_MINUTES}))`;
  try {
    await sendLoginCode(email, code);
    return { ok: true };
  } catch (e) {
    console.error("login code email failed", e);
    return { ok: false };
  }
}

// `onVerified` turns the email into an account id (creating the account on first sign-in).
export async function verifyCode(
  email: string, code: string, onVerified: (user: SessionUser) => Promise<string>,
): Promise<{ ok: true } | { ok: false; tooMany: boolean }> {
  if (neonAuthEnabled()) {
    const { error } = await neonAuth().signIn.emailOtp({ email, otp: code });
    return error ? { ok: false, tooMany: error.code === "TOO_MANY_ATTEMPTS" } : { ok: true };
  }
  if (await overLimit(`otp-verify:${email}`, 6, CODE_MINUTES)) return { ok: false, tooMany: true };
  const [hit] = await sql`UPDATE login_tokens SET used_at = now()
                          WHERE token_hash = ${sha256(`${email}:${code}`)} AND used_at IS NULL AND expires_at > now()
                          RETURNING email`;
  if (!hit) return { ok: false, tooMany: false };
  const accountId = await onVerified({ id: `local:${email}`, email });
  const token = randomToken();
  await sql`INSERT INTO sessions (token_hash, account_id, expires_at)
            VALUES (${sha256(token)}, ${accountId}, now() + make_interval(days => ${SESSION_DAYS}))`;
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true, secure: secureCookies(), sameSite: "lax", path: "/", maxAge: SESSION_DAYS * 86400,
  });
  return { ok: true };
}

export async function getSessionUser(): Promise<SessionUser | null> {
  if (neonAuthEnabled()) {
    const { data } = await neonAuth().getSession();
    return data?.user?.email ? { id: data.user.id, email: data.user.email.toLowerCase() } : null;
  }
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const [row] = await sql`SELECT a.email, a.auth_user_id FROM sessions s JOIN accounts a ON a.id = s.account_id
                          WHERE s.token_hash = ${sha256(token)} AND s.expires_at > now()`;
  return row ? { id: row.auth_user_id, email: row.email } : null;
}

export async function signOut() {
  if (neonAuthEnabled()) {
    await neonAuth().signOut();
    return;
  }
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await sql`DELETE FROM sessions WHERE token_hash = ${sha256(token)}`;
  jar.delete(SESSION_COOKIE);
}
