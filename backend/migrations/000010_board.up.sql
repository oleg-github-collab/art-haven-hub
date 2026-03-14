CREATE TABLE announcements (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type        announcement_type NOT NULL,
    title       TEXT NOT NULL,
    description TEXT NOT NULL,
    category    TEXT,
    location    TEXT,
    budget      TEXT,
    images      TEXT[] DEFAULT '{}',
    tags        TEXT[] DEFAULT '{}',
    is_active   BOOLEAN DEFAULT TRUE,
    expires_at  TIMESTAMPTZ,

    -- Vector embedding for matching
    embedding   vector(1536),

    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_announcements_author ON announcements(author_id);
CREATE INDEX idx_announcements_type ON announcements(type, created_at DESC);
CREATE INDEX idx_announcements_active ON announcements(is_active, created_at DESC) WHERE is_active = TRUE;
CREATE INDEX idx_announcements_title_trgm ON announcements USING gin(title gin_trgm_ops);
CREATE INDEX idx_announcements_tags ON announcements USING gin(tags);

CREATE INDEX idx_announcements_embedding ON announcements
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

CREATE TRIGGER announcements_updated_at
    BEFORE UPDATE ON announcements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
