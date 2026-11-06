-- Fixed-window rate limits for the audit, sign-in and connect forms.
-- Keys are sha256 hashes (of an IP, email or account id), so nothing identifying is stored.
CREATE TABLE rate_limit_hits (
  key text NOT NULL,
  hit_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX rate_limit_hits_key ON rate_limit_hits (key, hit_at DESC);
