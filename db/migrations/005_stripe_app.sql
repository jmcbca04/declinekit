-- Accounts can connect either with a pasted restricted key ('key') or by installing
-- the DeclineKit Stripe App ('app'), which uses our platform key with the Stripe-Account header.
ALTER TABLE accounts ADD COLUMN stripe_connection text CHECK (stripe_connection IN ('key', 'app'));
ALTER TABLE accounts ADD COLUMN app_installed_at timestamptz;
UPDATE accounts SET stripe_connection = 'key' WHERE stripe_key_enc IS NOT NULL;
-- One DeclineKit account per installed Stripe account.
CREATE UNIQUE INDEX accounts_app_stripe_account ON accounts (stripe_account_id) WHERE stripe_connection = 'app';
