-- ArtFlow: Connector system + workflow execution engine

-- Connector credentials per user
CREATE TABLE connectors (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    platform        TEXT NOT NULL,
    credentials     JSONB NOT NULL DEFAULT '{}',
    status          TEXT NOT NULL DEFAULT 'pending',
    scopes          TEXT[],
    meta            JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, platform)
);

-- Workflow execution history
CREATE TABLE workflow_executions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id     UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    trigger_type    TEXT NOT NULL DEFAULT 'manual',
    status          TEXT NOT NULL DEFAULT 'queued',
    started_at      TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ,
    error           TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Per-node execution logs
CREATE TABLE execution_node_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    execution_id    UUID NOT NULL REFERENCES workflow_executions(id) ON DELETE CASCADE,
    node_id         TEXT NOT NULL,
    node_type       TEXT NOT NULL,
    status          TEXT NOT NULL DEFAULT 'pending',
    input_data      JSONB DEFAULT '{}',
    output_data     JSONB DEFAULT '{}',
    error           TEXT,
    started_at      TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ,
    duration_ms     INTEGER DEFAULT 0
);

-- Incoming webhooks for external triggers
CREATE TABLE webhook_endpoints (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    workflow_id     UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    secret          TEXT NOT NULL,
    is_active       BOOLEAN DEFAULT true,
    last_triggered  TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Extend workflows table
ALTER TABLE workflows ADD COLUMN IF NOT EXISTS trigger_type TEXT DEFAULT 'manual';
ALTER TABLE workflows ADD COLUMN IF NOT EXISTS trigger_config JSONB DEFAULT '{}';
ALTER TABLE workflows ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT false;
ALTER TABLE workflows ADD COLUMN IF NOT EXISTS last_run_at TIMESTAMPTZ;
ALTER TABLE workflows ADD COLUMN IF NOT EXISTS run_count INTEGER DEFAULT 0;

-- Indexes
CREATE INDEX idx_connectors_user ON connectors(user_id);
CREATE INDEX idx_connectors_platform ON connectors(user_id, platform);
CREATE INDEX idx_executions_workflow ON workflow_executions(workflow_id);
CREATE INDEX idx_executions_user ON workflow_executions(user_id);
CREATE INDEX idx_executions_status ON workflow_executions(status) WHERE status IN ('queued', 'running');
CREATE INDEX idx_node_logs_execution ON execution_node_logs(execution_id);
CREATE INDEX idx_webhooks_workflow ON webhook_endpoints(workflow_id);
CREATE INDEX idx_webhooks_active ON webhook_endpoints(id) WHERE is_active = true;

-- Trigger for updated_at on connectors
CREATE TRIGGER set_connectors_updated_at
    BEFORE UPDATE ON connectors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
