CREATE TABLE uploads (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    filename    TEXT NOT NULL,
    filepath    TEXT NOT NULL,
    mime_type   TEXT NOT NULL,
    size_bytes  BIGINT NOT NULL,
    entity_type TEXT,
    entity_id   UUID,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_uploads_user ON uploads(user_id);
CREATE INDEX idx_uploads_entity ON uploads(entity_type, entity_id) WHERE entity_type IS NOT NULL;
