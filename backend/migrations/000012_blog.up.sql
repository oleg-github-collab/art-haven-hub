CREATE TABLE blog_posts (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title        TEXT NOT NULL,
    slug         TEXT UNIQUE NOT NULL,
    excerpt      TEXT,
    content      TEXT NOT NULL,
    cover_image  TEXT,
    tags         TEXT[] DEFAULT '{}',
    is_published BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMPTZ,
    view_count   INT DEFAULT 0,
    translations JSONB DEFAULT '{}',
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_blog_slug ON blog_posts(slug);
CREATE INDEX idx_blog_published ON blog_posts(published_at DESC) WHERE is_published = TRUE;
CREATE INDEX idx_blog_author ON blog_posts(author_id);
CREATE INDEX idx_blog_tags ON blog_posts USING gin(tags);
CREATE INDEX idx_blog_title_trgm ON blog_posts USING gin(title gin_trgm_ops);

CREATE TRIGGER blog_posts_updated_at
    BEFORE UPDATE ON blog_posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
