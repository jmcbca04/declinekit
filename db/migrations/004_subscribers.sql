-- People following the experiment by email (weekly numbers from /open).
CREATE TABLE subscribers (
  id bigserial PRIMARY KEY,
  email text UNIQUE NOT NULL,
  unsubscribe_token text UNIQUE NOT NULL,
  source text,
  created_at timestamptz NOT NULL DEFAULT now(),
  unsubscribed_at timestamptz
);
