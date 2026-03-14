CREATE TABLE subscriptions (
    id                     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id                UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan                   subscription_plan NOT NULL DEFAULT 'free',
    status                 subscription_status NOT NULL DEFAULT 'active',
    stripe_customer_id     TEXT,
    stripe_subscription_id TEXT,
    current_period_start   TIMESTAMPTZ,
    current_period_end     TIMESTAMPTZ,
    cancel_at_period_end   BOOLEAN DEFAULT FALSE,
    created_at             TIMESTAMPTZ DEFAULT NOW(),
    updated_at             TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe ON subscriptions(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
CREATE INDEX idx_subscriptions_status ON subscriptions(status) WHERE status = 'active';

CREATE TRIGGER subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
