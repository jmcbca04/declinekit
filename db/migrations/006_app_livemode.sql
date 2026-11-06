-- Stripe App installs can be in live mode or a Stripe sandbox. Sandbox installs are
-- served with the app's managed-sandbox API key and webhook instead of the live ones.
ALTER TABLE accounts ADD COLUMN stripe_livemode boolean NOT NULL DEFAULT true;
