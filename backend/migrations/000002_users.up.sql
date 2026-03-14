CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email           TEXT UNIQUE NOT NULL,
    password_hash   TEXT,
    name            TEXT NOT NULL,
    handle          TEXT UNIQUE NOT NULL,
    avatar_url      TEXT,
    cover_color     TEXT DEFAULT 'from-primary/20 via-accent to-secondary',
    bio             TEXT,
    location        TEXT,
    website         TEXT,
    tags            TEXT[] DEFAULT '{}',
    is_verified     BOOLEAN DEFAULT FALSE,
    preferred_lang  TEXT DEFAULT 'uk',
    taste_embedding vector(1536),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_roles (
    id      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role    user_role NOT NULL DEFAULT 'user',
    UNIQUE(user_id, role)
);

CREATE TABLE oauth_accounts (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider      oauth_provider NOT NULL,
    provider_id   TEXT NOT NULL,
    access_token  TEXT,
    refresh_token TEXT,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(provider, provider_id)
);

CREATE TABLE refresh_tokens (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    revoked    BOOLEAN DEFAULT FALSE
);

CREATE TABLE follows (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    followed_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(follower_id, followed_id),
    CHECK(follower_id != followed_id)
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_handle ON users(handle);
CREATE INDEX idx_users_name_trgm ON users USING gin(name gin_trgm_ops);
CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_oauth_provider ON oauth_accounts(provider, provider_id);
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id) WHERE revoked = FALSE;
CREATE INDEX idx_follows_follower ON follows(follower_id);
CREATE INDEX idx_follows_followed ON follows(followed_id);

-- Vector index for taste recommendations
CREATE INDEX idx_users_taste_embedding ON users
    USING hnsw (taste_embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

-- Trigger
CREATE TRIGGER users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
