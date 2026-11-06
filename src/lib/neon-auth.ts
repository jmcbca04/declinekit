import { createNeonAuth } from "@neondatabase/auth/next/server";

// Neon Auth (hosted, email OTP) is used when NEON_AUTH_BASE_URL is set, as on DeclineKit Cloud.
// Created on first use so self-hosted installs never need it configured.
let instance: ReturnType<typeof createNeonAuth> | null = null;

export const neonAuthEnabled = () => !!process.env.NEON_AUTH_BASE_URL;

export function neonAuth() {
  return (instance ??= createNeonAuth({
    baseUrl: process.env.NEON_AUTH_BASE_URL!,
    cookies: { secret: process.env.NEON_AUTH_COOKIE_SECRET!, sameSite: "lax" },
  }));
}
