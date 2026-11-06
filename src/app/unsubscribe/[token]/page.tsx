import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";

export const metadata = { title: "Unsubscribe — DeclineKit", robots: { index: false } };

// A button rather than an instant unsubscribe on load, so email link scanners can't
// unsubscribe people by prefetching the link.
export default async function Unsubscribe({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const [sub] = await sql`SELECT email, unsubscribed_at FROM subscribers WHERE unsubscribe_token = ${token}`;
  if (!sub) notFound();

  async function unsubscribe() {
    "use server";
    await sql`UPDATE subscribers SET unsubscribed_at = now() WHERE unsubscribe_token = ${token} AND unsubscribed_at IS NULL`;
    revalidatePath(`/unsubscribe/${token}`);
  }

  return (
    <main className="customer-page">
      <div className="customer-card">
        <p className="customer-brand">DeclineKit</p>
        {sub.unsubscribed_at ? (
          <>
            <h1>You&rsquo;re unsubscribed</h1>
            <p>No more weekly updates. The live numbers stay at declinekit.com/open if you&rsquo;re ever curious.</p>
          </>
        ) : (
          <>
            <h1>Stop the weekly updates?</h1>
            <p>{sub.email as string} will stop getting DeclineKit&rsquo;s weekly numbers.</p>
            <form action={unsubscribe}><button className="btn btn-primary btn-block">Unsubscribe</button></form>
          </>
        )}
      </div>
    </main>
  );
}
