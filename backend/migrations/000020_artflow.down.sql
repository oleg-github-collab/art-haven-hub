DROP TRIGGER IF EXISTS set_connectors_updated_at ON connectors;

DROP INDEX IF EXISTS idx_webhooks_active;
DROP INDEX IF EXISTS idx_webhooks_workflow;
DROP INDEX IF EXISTS idx_node_logs_execution;
DROP INDEX IF EXISTS idx_executions_status;
DROP INDEX IF EXISTS idx_executions_user;
DROP INDEX IF EXISTS idx_executions_workflow;
DROP INDEX IF EXISTS idx_connectors_platform;
DROP INDEX IF EXISTS idx_connectors_user;

ALTER TABLE workflows DROP COLUMN IF EXISTS trigger_type;
ALTER TABLE workflows DROP COLUMN IF EXISTS trigger_config;
ALTER TABLE workflows DROP COLUMN IF EXISTS is_active;
ALTER TABLE workflows DROP COLUMN IF EXISTS last_run_at;
ALTER TABLE workflows DROP COLUMN IF EXISTS run_count;

DROP TABLE IF EXISTS webhook_endpoints;
DROP TABLE IF EXISTS execution_node_logs;
DROP TABLE IF EXISTS workflow_executions;
DROP TABLE IF EXISTS connectors;
