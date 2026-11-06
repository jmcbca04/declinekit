-- Live vs. sandbox is a property of each invoice, not of the account: an account can
-- relink to a different Stripe account (Stripe's reviewers did exactly that), and its
-- earlier sandbox invoices must never be counted as real money.
ALTER TABLE failed_invoices ADD COLUMN IF NOT EXISTS livemode boolean NOT NULL DEFAULT true;

-- Backfill: invoices recorded while the account was linked to a sandbox.
UPDATE failed_invoices SET livemode = false
WHERE stripe_invoice_id IN ('in_1UTGp9Q2xOGFYb86UW44WVC3', 'in_1UWrO7Q2xOGFYb86JZPyroB0');
