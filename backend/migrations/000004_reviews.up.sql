CREATE TABLE artwork_reviews (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    artwork_id UUID NOT NULL REFERENCES artworks(id) ON DELETE CASCADE,
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating     SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment    TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(artwork_id, user_id)
);

CREATE INDEX idx_reviews_artwork ON artwork_reviews(artwork_id);
CREATE INDEX idx_reviews_user ON artwork_reviews(user_id);
CREATE INDEX idx_reviews_rating ON artwork_reviews(artwork_id, rating);

CREATE TRIGGER reviews_updated_at
    BEFORE UPDATE ON artwork_reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
