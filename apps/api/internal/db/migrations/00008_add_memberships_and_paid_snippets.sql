-- +goose Up
ALTER TABLE snippets
  ADD COLUMN IF NOT EXISTS requires_subscription BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS member_users (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS member_subscriptions (
  user_id UUID PRIMARY KEY REFERENCES member_users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT NOT NULL DEFAULT '',
  stripe_subscription_id TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'inactive',
  current_period_end TIMESTAMPTZ NULL,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
  price_id TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT member_subscriptions_status_check CHECK (
    status IN (
      'inactive',
      'trialing',
      'active',
      'past_due',
      'canceled',
      'unpaid',
      'incomplete',
      'incomplete_expired',
      'paused'
    )
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_member_users_email ON member_users (email);
CREATE UNIQUE INDEX IF NOT EXISTS idx_member_subscriptions_customer_id
  ON member_subscriptions (stripe_customer_id)
  WHERE stripe_customer_id <> '';
CREATE UNIQUE INDEX IF NOT EXISTS idx_member_subscriptions_subscription_id
  ON member_subscriptions (stripe_subscription_id)
  WHERE stripe_subscription_id <> '';

-- +goose Down
DROP INDEX IF EXISTS idx_member_subscriptions_subscription_id;
DROP INDEX IF EXISTS idx_member_subscriptions_customer_id;
DROP INDEX IF EXISTS idx_member_users_email;

DROP TABLE IF EXISTS member_subscriptions;
DROP TABLE IF EXISTS member_users;

ALTER TABLE snippets
  DROP COLUMN IF EXISTS requires_subscription;
