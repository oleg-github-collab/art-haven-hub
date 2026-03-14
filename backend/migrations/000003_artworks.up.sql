CREATE TABLE categories (
    id    TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    sort  INT DEFAULT 0
);

INSERT INTO categories (id, label, sort) VALUES
    ('painting', 'Живопис', 1),
    ('ceramics', 'Кераміка', 2),
    ('photo', 'Фотографія', 3),
    ('inventory', 'Інвентар', 4),
    ('materials', 'Матеріали', 5),
    ('services', 'Послуги', 6),
    ('digital', 'Цифрове мистецтво', 7);

CREATE TABLE artworks (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title             TEXT NOT NULL,
    description       TEXT,
    full_description  TEXT,
    price_cents       BIGINT NOT NULL CHECK (price_cents >= 0),
    currency          TEXT NOT NULL DEFAULT 'EUR',
    artist_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id       TEXT NOT NULL REFERENCES categories(id),
    subcategory       TEXT,
    condition         artwork_condition,
    status            artwork_status DEFAULT 'draft',

    -- Media
    images            TEXT[] DEFAULT '{}',
    emoji             TEXT,

    -- Dimensions (for AR preview)
    width_cm          DOUBLE PRECISION,
    height_cm         DOUBLE PRECISION,

    -- Metadata
    tags              TEXT[] DEFAULT '{}',
    translations      JSONB DEFAULT '{}',

    -- Stats (denormalized counters)
    view_count        INT DEFAULT 0,
    like_count        INT DEFAULT 0,

    -- Auction
    is_biddable       BOOLEAN DEFAULT FALSE,
    current_bid_cents BIGINT DEFAULT 0,
    bid_count         INT DEFAULT 0,

    -- Shipping
    shipping_options  TEXT[] DEFAULT '{}',
    return_policy     TEXT,

    -- Seller location
    city              TEXT,
    country           TEXT,

    -- Promotion
    is_promoted       BOOLEAN DEFAULT FALSE,
    promoted_until    TIMESTAMPTZ,
    is_featured       BOOLEAN DEFAULT FALSE,

    -- Vector embedding for semantic search
    embedding         vector(1536),

    created_at        TIMESTAMPTZ DEFAULT NOW(),
    updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_artworks_artist ON artworks(artist_id);
CREATE INDEX idx_artworks_status ON artworks(status) WHERE status IN ('active', 'promoted');
CREATE INDEX idx_artworks_category ON artworks(category_id);
CREATE INDEX idx_artworks_price ON artworks(price_cents);
CREATE INDEX idx_artworks_created ON artworks(created_at DESC);
CREATE INDEX idx_artworks_promoted ON artworks(is_promoted, promoted_until) WHERE is_promoted = TRUE;
CREATE INDEX idx_artworks_featured ON artworks(is_featured) WHERE is_featured = TRUE;
CREATE INDEX idx_artworks_country ON artworks(country);
CREATE INDEX idx_artworks_city_trgm ON artworks USING gin(city gin_trgm_ops);
CREATE INDEX idx_artworks_title_trgm ON artworks USING gin(title gin_trgm_ops);
CREATE INDEX idx_artworks_desc_trgm ON artworks USING gin(description gin_trgm_ops);
CREATE INDEX idx_artworks_tags ON artworks USING gin(tags);

-- Vector index for semantic search (HNSW)
CREATE INDEX idx_artworks_embedding ON artworks
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

CREATE TRIGGER artworks_updated_at
    BEFORE UPDATE ON artworks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
