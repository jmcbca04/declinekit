import type { NextConfig } from "next";

const securityHeaders = [
  // Nobody gets to frame our pages (stops clickjacking the dashboard toggles).
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // The Docker image runs Next's self-contained server; Vercel builds ignore this.
  output: process.env.NEXT_OUTPUT === "standalone" ? "standalone" : undefined,
  // Browsers request /favicon.ico regardless of <link rel="icon">; serve the SVG mark.
  async rewrites() {
    return [{ source: "/favicon.ico", destination: "/icon.svg" }];
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
