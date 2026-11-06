import { neonAuth, neonAuthEnabled } from "@/lib/neon-auth";

// Neon Auth's own endpoints (Cloud only). Self-hosted installs use the built-in sign-in instead.
type Handler = (...args: unknown[]) => Promise<Response>;
const notFound = async () => new Response("Not found", { status: 404 });
const forward = (method: "GET" | "POST"): Handler => (...args) =>
  neonAuthEnabled() ? (neonAuth().handler()[method] as unknown as Handler)(...args) : notFound();

export const GET = forward("GET");
export const POST = forward("POST");
