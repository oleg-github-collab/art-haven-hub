-- Message reactions
CREATE TABLE message_reactions (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id  UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    emoji       TEXT NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(message_id, user_id, emoji)
);

-- Message forwarding tracking
CREATE TABLE message_forwards (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    original_message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    forwarded_to_conv   UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    forwarded_by        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_reactions_message ON message_reactions(message_id);
CREATE INDEX idx_reactions_user ON message_reactions(user_id);
CREATE INDEX idx_forwards_original ON message_forwards(original_message_id);
