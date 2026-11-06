-- DeclineKit database schema for a fresh install.
-- `npm run migrate` applies this to an empty database and marks every file in db/migrations
-- as applied; on an existing database it applies only the migrations it hasn't seen yet.

CREATE TABLE accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  brand_name text,
  from_name text,
  reply_to text,
  stripe_key_enc text,
  stripe_account_id text,
  webhook_endpoint_id text,
  webhook_secret_enc text,
  billing_customer_id text,
  billing_subscription_id text,
  plan text,
  subscription_status text NOT NULL DEFAULT 'trialing',
  trial_ends_at timestamptz NOT NULL DEFAULT (now() + interval '60 days'),
  emails_enabled boolean NOT NULL DEFAULT false,
  stripe_account_name text,
  auth_user_id text UNIQUE,
  stripe_connection text CHECK (stripe_connection IN ('key', 'app')),
  app_installed_at timestamptz,
  stripe_livemode boolean NOT NULL DEFAULT true
);
CREATE UNIQUE INDEX accounts_app_stripe_account ON accounts (stripe_account_id) WHERE stripe_connection = 'app';

CREATE TABLE failed_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  stripe_invoice_id text NOT NULL,
  stripe_customer_id text NOT NULL,
  customer_email text,
  customer_name text,
  amount_cents integer NOT NULL,
  currency text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  decline_code text,
  failed_at timestamptz NOT NULL DEFAULT now(),
  recovered_at timestamptz,
  recovered_via text,
  update_token text NOT NULL UNIQUE,
  emails_sent integer NOT NULL DEFAULT 0,
  next_email_at timestamptz,
  livemode boolean NOT NULL DEFAULT true,
  UNIQUE (account_id, stripe_invoice_id)
);
CREATE INDEX failed_invoices_due ON failed_invoices (next_email_at) WHERE status = 'open';

CREATE TABLE email_log (
  id bigserial PRIMARY KEY,
  failed_invoice_id uuid NOT NULL REFERENCES failed_invoices(id) ON DELETE CASCADE,
  step integer NOT NULL,
  provider_id text,
  sent_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE expiring_reminders (
  id bigserial PRIMARY KEY,
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  stripe_customer_id text NOT NULL,
  stripe_subscription_id text NOT NULL,
  payment_method_id text NOT NULL,
  card_expires text NOT NULL,
  customer_email text NOT NULL,
  customer_name text,
  update_token text NOT NULL UNIQUE,
  sent_at timestamptz NOT NULL DEFAULT now(),
  card_updated_at timestamptz,
  UNIQUE (account_id, payment_method_id, card_expires)
);
CREATE INDEX expiring_reminders_account ON expiring_reminders (account_id, sent_at DESC);

CREATE TABLE audits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text,
  failed_cents bigint,
  recoverable_cents bigint,
  failed_count integer,
  currency text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Keys are sha256 hashes (of an IP, email or id), so nothing identifying is stored.
CREATE TABLE rate_limit_hits (
  key text NOT NULL,
  hit_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX rate_limit_hits_key ON rate_limit_hits (key, hit_at DESC);

CREATE TABLE subscribers (
  id bigserial PRIMARY KEY,
  email text NOT NULL UNIQUE,
  unsubscribe_token text NOT NULL UNIQUE,
  source text,
  created_at timestamptz NOT NULL DEFAULT now(),
  unsubscribed_at timestamptz
);

-- Built-in sign-in (self-hosted). Codes and session tokens are stored only as sha256 hashes.
CREATE TABLE login_tokens (
  token_hash text PRIMARY KEY,
  email text NOT NULL,
  expires_at timestamptz NOT NULL,
  used_at timestamptz
);
CREATE TABLE sessions (
  token_hash text PRIMARY KEY,
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL
);
