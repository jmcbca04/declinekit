import Link from "next/link";
import { redirect } from "next/navigation";
import { currentAccount } from "@/lib/auth";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sign in — DeclineKit" };

export default async function Login() {
  if (await currentAccount()) redirect("/app");
  return (
    <main className="narrow">
      <Link href="/" className="wordmark">DeclineKit</Link>
      <LoginForm />
    </main>
  );
}
