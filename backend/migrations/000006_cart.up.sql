CREATE TABLE cart_items (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    artwork_id UUID NOT NULL REFERENCES artworks(id) ON DELETE CASCADE,
    quantity   INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    added_at   TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, artwork_id)
);

CREATE INDEX idx_cart_user ON cart_items(user_id);
