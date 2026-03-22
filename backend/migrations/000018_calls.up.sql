CREATE TYPE call_status AS ENUM ('initiating', 'ringing', 'connected', 'ended', 'missed', 'rejected');
CREATE TYPE call_type AS ENUM ('audio', 'video');

CREATE TABLE calls (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    caller_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    callee_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    call_type       call_type NOT NULL DEFAULT 'audio',
    status          call_status NOT NULL DEFAULT 'initiating',
    started_at      TIMESTAMPTZ,
    ended_at        TIMESTAMPTZ,
    duration_secs   INTEGER DEFAULT 0,
    end_reason      TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_calls_conversation ON calls(conversation_id);
CREATE INDEX idx_calls_caller ON calls(caller_id);
CREATE INDEX idx_calls_callee ON calls(callee_id);
CREATE INDEX idx_calls_status ON calls(status) WHERE status IN ('initiating', 'ringing', 'connected');
CREATE INDEX idx_calls_created ON calls(created_at DESC);

CREATE TRIGGER calls_updated_at
    BEFORE UPDATE ON calls
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
