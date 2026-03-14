CREATE TABLE promotions (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    artwork_id        UUID NOT NULL REFERENCES artworks(id) ON DELETE CASCADE,
    user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan              TEXT NOT NULL,
    duration_days     INT NOT NULL,
    price_cents       BIGINT NOT NULL,
    currency          TEXT NOT NULL DEFAULT 'EUR',
    stripe_payment_id TEXT,
    starts_at         TIMESTAMPTZ,
    ends_at           TIMESTAMPTZ,
    is_active         BOOLEAN DEFAULT FALSE,
    created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_promotions_artwork ON promotions(artwork_id);
CREATE INDEX idx_promotions_user ON promotions(user_id);
CREATE INDEX idx_promotions_active ON promotions(is_active, ends_at) WHERE is_active = TRUE;
