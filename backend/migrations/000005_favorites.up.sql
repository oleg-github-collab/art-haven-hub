CREATE TABLE artwork_favorites (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    artwork_id UUID NOT NULL REFERENCES artworks(id) ON DELETE CASCADE,
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(artwork_id, user_id)
);

CREATE INDEX idx_favorites_user ON artwork_favorites(user_id, created_at DESC);
CREATE INDEX idx_favorites_artwork ON artwork_favorites(artwork_id);
