-- Social Hub: accounts, scheduled posts, campaigns, workflows

CREATE TYPE scheduled_post_status AS ENUM ('draft', 'scheduled', 'published', 'failed', 'processing', 'paused');
CREATE TYPE campaign_status       AS ENUM ('draft', 'scheduled', 'active', 'completed');

-- Social account connections
CREATE TABLE social_accounts (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    platform    TEXT NOT NULL,              -- instagram, pinterest, etsy, tiktok, x, facebook, threads, printful
    handle      TEXT NOT NULL DEFAULT '',
    connected   BOOLEAN NOT NULL DEFAULT false,
    followers   INTEGER DEFAULT 0,
    auto_post   BOOLEAN NOT NULL DEFAULT false,
    meta        JSONB DEFAULT '{}',        -- platform-specific tokens / settings
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, platform)
);

CREATE INDEX idx_social_accounts_user ON social_accounts(user_id);

-- Scheduled posts (content calendar + auto-post queue)
CREATE TABLE scheduled_posts (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title       TEXT NOT NULL,
    platform    TEXT NOT NULL,
    caption     TEXT DEFAULT '',
    date        DATE NOT NULL,
    time        TIME NOT NULL DEFAULT '12:00',
    status      scheduled_post_status NOT NULL DEFAULT 'scheduled',
    retries     INTEGER DEFAULT 0,
    artwork_id  UUID REFERENCES artworks(id) ON DELETE SET NULL,
    campaign_id UUID,                      -- FK added after campaigns table
    meta        JSONB DEFAULT '{}',
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_scheduled_posts_user   ON scheduled_posts(user_id);
CREATE INDEX idx_scheduled_posts_date   ON scheduled_posts(date);
CREATE INDEX idx_scheduled_posts_status ON scheduled_posts(status) WHERE status IN ('scheduled', 'processing');

-- Marketing campaigns
CREATE TABLE campaigns (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name         TEXT NOT NULL,
    platforms    TEXT[] DEFAULT '{}',
    status       campaign_status NOT NULL DEFAULT 'draft',
    scheduled_at TIMESTAMPTZ,
    reach        INTEGER DEFAULT 0,
    engagement   INTEGER DEFAULT 0,
    meta         JSONB DEFAULT '{}',
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_campaigns_user   ON campaigns(user_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);

-- Add FK from scheduled_posts to campaigns
ALTER TABLE scheduled_posts
    ADD CONSTRAINT fk_scheduled_posts_campaign
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE SET NULL;

-- Workflow builder templates / saved workflows
CREATE TABLE workflows (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name         TEXT NOT NULL,
    description  TEXT DEFAULT '',
    icon         TEXT DEFAULT '',
    nodes        JSONB NOT NULL DEFAULT '[]',
    connections  JSONB NOT NULL DEFAULT '[]',
    is_public    BOOLEAN NOT NULL DEFAULT false,
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_workflows_user ON workflows(user_id);

-- Triggers for updated_at
CREATE TRIGGER update_social_accounts_updated_at BEFORE UPDATE ON social_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_scheduled_posts_updated_at BEFORE UPDATE ON scheduled_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_campaigns_updated_at       BEFORE UPDATE ON campaigns       FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_workflows_updated_at       BEFORE UPDATE ON workflows       FOR EACH ROW EXECUTE FUNCTION update_updated_at();
