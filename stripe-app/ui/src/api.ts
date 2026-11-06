import { useEffect, useState } from 'react';
import type { ExtensionContextValue } from '@stripe/ui-extension-sdk/context';
import fetchStripeSignature from '@stripe/ui-extension-sdk/signature';

export type Case = {
  invoice_id: string;
  customer_id: string;
  customer: string | null;
  amount: string;
  status: 'open' | 'recovered' | 'lost';
  recovered_via: string | null;
  emails_sent: number;
  failed_at: string;
};

export type Summary = {
  linked: boolean;
  link_url?: string;
  dashboard_url: string;
  emails_enabled?: boolean;
  plan?: string;
  free_status?: string;
  recovered_month?: string;
  recovered_all?: string;
  open_amount?: string;
  open_count?: number;
  expiring_soon?: number;
  cases?: Case[];
};

// Loads DeclineKit's view of this Stripe account from our backend. The request is signed
// with fetchStripeSignature so the backend knows which account and user are asking.
export function useDeclineKit(context: ExtensionContextValue, view: string, objectId?: string) {
  const [data, setData] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const base = String(context.environment.constants?.API_BASE ?? 'https://declinekit.com');
  const userId = context.userContext?.id;
  const accountId = context.userContext?.account.id;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${base}/api/stripe-app/data`, {
          method: 'POST',
          headers: { 'Stripe-Signature': await fetchStripeSignature(), 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: userId,
            account_id: accountId,
            view,
            object_id: objectId ?? null,
          }),
        });
        if (!res.ok) throw new Error(`DeclineKit returned ${res.status}`);
        const json = (await res.json()) as Summary;
        if (!cancelled) setData(json);
      } catch {
        if (!cancelled) setError("Couldn't reach DeclineKit. Try again in a minute.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [base, view, objectId, userId, accountId]);

  return { data, error };
}

export const statusBadge = (c: Case): { label: string; type: 'positive' | 'warning' | 'neutral' } =>
  c.status === 'recovered'
    ? { label: c.recovered_via === 'card_update' ? 'Recovered: new card' : 'Recovered: retry', type: 'positive' }
    : c.status === 'open'
      ? { label: `In recovery · ${c.emails_sent} of 4 emails`, type: 'warning' }
      : { label: 'Lost', type: 'neutral' };
