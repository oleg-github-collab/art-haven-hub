CREATE TABLE daily_artwork_stats (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    artwork_id  UUID NOT NULL REFERENCES artworks(id) ON DELETE CASCADE,
    date        DATE NOT NULL,
    views       INT DEFAULT 0,
    likes       INT DEFAULT 0,
    favorites   INT DEFAULT 0,
    cart_adds   INT DEFAULT 0,
    purchases   INT DEFAULT 0,
    revenue_cents BIGINT DEFAULT 0,
    UNIQUE(artwork_id, date)
);

CREATE TABLE daily_artist_stats (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    artist_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date          DATE NOT NULL,
    total_views   INT DEFAULT 0,
    total_likes   INT DEFAULT 0,
    total_favorites INT DEFAULT 0,
    total_sales   INT DEFAULT 0,
    total_revenue_cents BIGINT DEFAULT 0,
    new_followers INT DEFAULT 0,
    UNIQUE(artist_id, date)
);

CREATE INDEX idx_artwork_stats_artwork ON daily_artwork_stats(artwork_id, date DESC);
CREATE INDEX idx_artwork_stats_date ON daily_artwork_stats(date);
CREATE INDEX idx_artist_stats_artist ON daily_artist_stats(artist_id, date DESC);
CREATE INDEX idx_artist_stats_date ON daily_artist_stats(date);
