CREATE TABLE feed_posts (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content       TEXT NOT NULL,
    images        TEXT[] DEFAULT '{}',
    tags          TEXT[] DEFAULT '{}',

    -- Denormalized counters
    like_count    INT DEFAULT 0,
    comment_count INT DEFAULT 0,
    repost_count  INT DEFAULT 0,

    -- Vector embedding for semantic search
    embedding     vector(1536),

    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE feed_comments (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id    UUID NOT NULL REFERENCES feed_posts(id) ON DELETE CASCADE,
    author_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content    TEXT NOT NULL,
    like_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE feed_likes (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id    UUID NOT NULL REFERENCES feed_posts(id) ON DELETE CASCADE,
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

CREATE TABLE feed_reposts (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id    UUID NOT NULL REFERENCES feed_posts(id) ON DELETE CASCADE,
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

CREATE TABLE feed_bookmarks (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id    UUID NOT NULL REFERENCES feed_posts(id) ON DELETE CASCADE,
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

CREATE TABLE feed_comment_likes (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    comment_id UUID NOT NULL REFERENCES feed_comments(id) ON DELETE CASCADE,
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(comment_id, user_id)
);

-- Indexes
CREATE INDEX idx_feed_posts_author ON feed_posts(author_id, created_at DESC);
CREATE INDEX idx_feed_posts_created ON feed_posts(created_at DESC);
CREATE INDEX idx_feed_posts_hot ON feed_posts((like_count + repost_count) DESC, created_at DESC);
CREATE INDEX idx_feed_posts_content_trgm ON feed_posts USING gin(content gin_trgm_ops);
CREATE INDEX idx_feed_posts_tags ON feed_posts USING gin(tags);

CREATE INDEX idx_feed_comments_post ON feed_comments(post_id, created_at);
CREATE INDEX idx_feed_likes_post ON feed_likes(post_id);
CREATE INDEX idx_feed_likes_user ON feed_likes(user_id);
CREATE INDEX idx_feed_reposts_post ON feed_reposts(post_id);
CREATE INDEX idx_feed_bookmarks_user ON feed_bookmarks(user_id, created_at DESC);

-- Vector index for semantic search
CREATE INDEX idx_feed_posts_embedding ON feed_posts
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

CREATE TRIGGER feed_posts_updated_at
    BEFORE UPDATE ON feed_posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER feed_comments_updated_at
    BEFORE UPDATE ON feed_comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
