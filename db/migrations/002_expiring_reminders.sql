-- Expiring-card reminders: one row per card per expiry month, so a customer is reminded once.
CREATE TABLE expiring_reminders (
  id bigserial PRIMARY KEY,
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  stripe_customer_id text NOT NULL,
  stripe_subscription_id text NOT NULL,
  payment_method_id text NOT NULL,
  card_expires text NOT NULL,          -- 'YYYY-MM'
  customer_email text NOT NULL,
  customer_name text,
  update_token text UNIQUE NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  card_updated_at timestamptz,
  UNIQUE (account_id, payment_method_id, card_expires)
);
CREATE INDEX expiring_reminders_account ON expiring_reminders (account_id, sent_at DESC);
