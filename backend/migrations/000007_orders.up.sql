CREATE TABLE orders (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    buyer_id            UUID NOT NULL REFERENCES users(id),
    status              order_status NOT NULL DEFAULT 'pending',
    total_cents         BIGINT NOT NULL CHECK (total_cents >= 0),
    commission_cents    BIGINT NOT NULL DEFAULT 0,
    currency            TEXT NOT NULL DEFAULT 'EUR',

    -- Stripe
    stripe_session_id   TEXT,
    stripe_payment_id   TEXT,

    -- Shipping
    shipping_name       TEXT,
    shipping_email      TEXT,
    shipping_phone      TEXT,
    shipping_address    JSONB,
    shipping_method     TEXT,

    notes               TEXT,
    paid_at             TIMESTAMPTZ,
    shipped_at          TIMESTAMPTZ,
    delivered_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE order_items (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    artwork_id      UUID NOT NULL REFERENCES artworks(id),
    seller_id       UUID NOT NULL REFERENCES users(id),
    quantity        INT NOT NULL DEFAULT 1,
    price_cents     BIGINT NOT NULL,
    commission_cents BIGINT NOT NULL DEFAULT 0,
    currency        TEXT NOT NULL DEFAULT 'EUR'
);

CREATE INDEX idx_orders_buyer ON orders(buyer_id, created_at DESC);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_stripe ON orders(stripe_session_id) WHERE stripe_session_id IS NOT NULL;
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_seller ON order_items(seller_id, order_id);

CREATE TRIGGER orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
