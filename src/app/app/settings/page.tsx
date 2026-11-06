import { requireAccount } from "@/lib/auth";
import { CLOUD } from "@/lib/config";
import { isConnected } from "@/lib/stripe";
import { PLANS, type PlanId } from "@/lib/plans";
import { deleteAccountAction, disconnectAction, openPortal, saveSettings, subscribe } from "../actions";

export default async function Settings({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const account = await requireAccount();
  const { saved, error } = await searchParams;
  const subscribed = account.subscription_status === "active" || account.subscription_status === "past_due";
  return (
    <>
      <section>
        <h1>Settings</h1>
        <form action={saveSettings} className="stack narrow-form">
          <label htmlFor="brand_name">Product name in emails</label>
          <input id="brand_name" name="brand_name" defaultValue={account.brand_name ?? ""} placeholder="Acme Analytics" />
          <label htmlFor="from_name">Sender name</label>
          <input id="from_name" name="from_name" defaultValue={account.from_name ?? ""} placeholder="Jess from Acme" />
          <label htmlFor="reply_to">Replies go to</label>
          <input id="reply_to" name="reply_to" type="email" defaultValue={account.reply_to ?? ""} placeholder="support@acme.com" />
          <button className="btn btn-primary">Save settings</button>
          {saved && <p className="ok">Settings saved.</p>}
          {error === "reply_to" && <p className="error">&ldquo;Replies go to&rdquo; needs to be a single email address.</p>}
        </form>
      </section>

      {CLOUD && (
      <section id="plans">
        <h2>Billing</h2>
        {subscribed ? (
          <>
            <p>You&rsquo;re on the {PLANS[account.plan as PlanId]?.name ?? "paid"} plan.</p>
            <form action={openPortal}><button className="btn">Manage billing</button></form>
          </>
        ) : (
          <div className="plans">
            {(Object.keys(PLANS) as PlanId[]).map((id) => (
              <form key={id} action={subscribe} className="plan">
                <input type="hidden" name="plan" value={id} />
                <h3>{PLANS[id].name}</h3>
                <p className="plan-price">${PLANS[id].price}<span>/month</span></p>
                <p>{PLANS[id].limit}</p>
                <button className={id === "growth" ? "btn btn-primary" : "btn"} data-fast-goal="checkout_started" data-fast-goal-plan={id}>Choose {PLANS[id].name}</button>
              </form>
            ))}
          </div>
        )}
      </section>
      )}

      {isConnected(account) && (
        <section id="stripe">
          <h2>Stripe connection</h2>
          <p>
            Connected to {account.stripe_account_name ?? "your Stripe account"}
            {account.stripe_connection === "app"
              ? " through the DeclineKit Stripe App. Disconnecting stops all emails here; uninstall the app in Stripe (Settings → Installed apps) to revoke our access entirely."
              : ". Disconnecting removes our webhook from Stripe, deletes the key we stored and stops all emails. Delete the key in Stripe too if you won’t reconnect."}
          </p>
          <form action={disconnectAction}><button className="btn">Disconnect Stripe</button></form>
        </section>
      )}

      <section id="delete">
        <h2>Delete account</h2>
        <p>
          Deletes your account, your Stripe key, and every customer name, email and invoice record we hold. Any paid plan
          is cancelled. This can&rsquo;t be undone.
        </p>
        <form action={deleteAccountAction} className="stack narrow-form">
          <label className="check"><input type="checkbox" name="confirm" required /> I understand this deletes everything</label>
          <button className="btn">Delete my account</button>
        </form>
      </section>
    </>
  );
}
