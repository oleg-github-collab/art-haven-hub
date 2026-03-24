package repository

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

	"github.com/art-haven-hub/backend/internal/model"
	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
)

type ConnectorRepo struct {
	db *sqlx.DB
}

func NewConnectorRepo(db *sqlx.DB) *ConnectorRepo {
	return &ConnectorRepo{db: db}
}

// ═══════════════════════════════════════════════════════════════
//  Connectors
// ═══════════════════════════════════════════════════════════════

func (r *ConnectorRepo) Upsert(ctx context.Context, c *model.Connector) error {
	query := `
		INSERT INTO connectors (user_id, platform, credentials, status, scopes, meta)
		VALUES ($1, $2, $3, $4, $5, $6)
		ON CONFLICT (user_id, platform)
		DO UPDATE SET credentials = $3, status = $4, scopes = $5, meta = $6
		RETURNING id, created_at, updated_at`
	return r.db.QueryRowxContext(ctx, query,
		c.UserID, c.Platform, c.Credentials, c.Status, c.Scopes, c.Meta,
	).Scan(&c.ID, &c.CreatedAt, &c.UpdatedAt)
}

func (r *ConnectorRepo) Get(ctx context.Context, userID uuid.UUID, platform string) (*model.Connector, error) {
	var c model.Connector
	err := r.db.GetContext(ctx, &c,
		`SELECT * FROM connectors WHERE user_id = $1 AND platform = $2`, userID, platform)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	return &c, err
}

func (r *ConnectorRepo) List(ctx context.Context, userID uuid.UUID) ([]model.Connector, error) {
	var connectors []model.Connector
	err := r.db.SelectContext(ctx, &connectors,
		`SELECT * FROM connectors WHERE user_id = $1 ORDER BY platform`, userID)
	if err != nil {
		return nil, fmt.Errorf("listing connectors: %w", err)
	}
	return connectors, nil
}

func (r *ConnectorRepo) UpdateStatus(ctx context.Context, userID uuid.UUID, platform, status string) error {
	_, err := r.db.ExecContext(ctx,
		`UPDATE connectors SET status = $1 WHERE user_id = $2 AND platform = $3`,
		status, userID, platform)
	return err
}

func (r *ConnectorRepo) Delete(ctx context.Context, userID uuid.UUID, platform string) error {
	_, err := r.db.ExecContext(ctx,
		`DELETE FROM connectors WHERE user_id = $1 AND platform = $2`, userID, platform)
	return err
}

// ═══════════════════════════════════════════════════════════════
//  Workflow Executions
// ═══════════════════════════════════════════════════════════════

func (r *ConnectorRepo) CreateExecution(ctx context.Context, e *model.WorkflowExecution) error {
	query := `
		INSERT INTO workflow_executions (workflow_id, user_id, trigger_type, status)
		VALUES ($1, $2, $3, $4)
		RETURNING id, created_at`
	return r.db.QueryRowxContext(ctx, query,
		e.WorkflowID, e.UserID, e.TriggerType, e.Status,
	).Scan(&e.ID, &e.CreatedAt)
}

func (r *ConnectorRepo) GetExecution(ctx context.Context, id uuid.UUID) (*model.WorkflowExecution, error) {
	var e model.WorkflowExecution
	err := r.db.GetContext(ctx, &e,
		`SELECT * FROM workflow_executions WHERE id = $1`, id)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	return &e, err
}

func (r *ConnectorRepo) ListExecutions(ctx context.Context, userID uuid.UUID, limit int) ([]model.WorkflowExecution, error) {
	if limit <= 0 {
		limit = 50
	}
	var execs []model.WorkflowExecution
	err := r.db.SelectContext(ctx, &execs,
		`SELECT * FROM workflow_executions WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2`,
		userID, limit)
	if err != nil {
		return nil, fmt.Errorf("listing executions: %w", err)
	}
	return execs, nil
}

func (r *ConnectorRepo) ListWorkflowExecutions(ctx context.Context, workflowID uuid.UUID, limit int) ([]model.WorkflowExecution, error) {
	if limit <= 0 {
		limit = 20
	}
	var execs []model.WorkflowExecution
	err := r.db.SelectContext(ctx, &execs,
		`SELECT * FROM workflow_executions WHERE workflow_id = $1 ORDER BY created_at DESC LIMIT $2`,
		workflowID, limit)
	if err != nil {
		return nil, fmt.Errorf("listing workflow executions: %w", err)
	}
	return execs, nil
}

func (r *ConnectorRepo) UpdateExecutionStatus(ctx context.Context, id uuid.UUID, status string, errMsg *string) error {
	if status == "running" {
		_, err := r.db.ExecContext(ctx,
			`UPDATE workflow_executions SET status = $1, started_at = NOW() WHERE id = $2`, status, id)
		return err
	}
	_, err := r.db.ExecContext(ctx,
		`UPDATE workflow_executions SET status = $1, completed_at = NOW(), error = $2 WHERE id = $3`,
		status, errMsg, id)
	return err
}

// ═══════════════════════════════════════════════════════════════
//  Execution Node Logs
// ═══════════════════════════════════════════════════════════════

func (r *ConnectorRepo) CreateNodeLog(ctx context.Context, l *model.ExecutionNodeLog) error {
	query := `
		INSERT INTO execution_node_logs (execution_id, node_id, node_type, status)
		VALUES ($1, $2, $3, $4)
		RETURNING id`
	return r.db.QueryRowxContext(ctx, query,
		l.ExecutionID, l.NodeID, l.NodeType, l.Status,
	).Scan(&l.ID)
}

func (r *ConnectorRepo) UpdateNodeLog(ctx context.Context, id uuid.UUID, status string, output, errMsg *string, durationMs int) error {
	var outputJSON interface{} = nil
	if output != nil {
		outputJSON = *output
	}
	_, err := r.db.ExecContext(ctx, `
		UPDATE execution_node_logs
		SET status = $1, output_data = COALESCE($2::jsonb, output_data),
		    error = $3, completed_at = NOW(), duration_ms = $4,
		    started_at = COALESCE(started_at, NOW())
		WHERE id = $5`,
		status, outputJSON, errMsg, durationMs, id)
	return err
}

func (r *ConnectorRepo) StartNodeLog(ctx context.Context, id uuid.UUID, inputData string) error {
	_, err := r.db.ExecContext(ctx, `
		UPDATE execution_node_logs SET status = 'running', started_at = NOW(), input_data = $1::jsonb
		WHERE id = $2`, inputData, id)
	return err
}

func (r *ConnectorRepo) GetNodeLogs(ctx context.Context, executionID uuid.UUID) ([]model.ExecutionNodeLog, error) {
	var logs []model.ExecutionNodeLog
	err := r.db.SelectContext(ctx, &logs,
		`SELECT * FROM execution_node_logs WHERE execution_id = $1 ORDER BY started_at ASC NULLS LAST`, executionID)
	if err != nil {
		return nil, fmt.Errorf("getting node logs: %w", err)
	}
	return logs, nil
}

// ═══════════════════════════════════════════════════════════════
//  Webhook Endpoints
// ═══════════════════════════════════════════════════════════════

func (r *ConnectorRepo) CreateWebhook(ctx context.Context, w *model.WebhookEndpoint) error {
	query := `
		INSERT INTO webhook_endpoints (user_id, workflow_id, secret, is_active)
		VALUES ($1, $2, $3, $4)
		RETURNING id, created_at`
	return r.db.QueryRowxContext(ctx, query,
		w.UserID, w.WorkflowID, w.Secret, w.IsActive,
	).Scan(&w.ID, &w.CreatedAt)
}

func (r *ConnectorRepo) GetWebhook(ctx context.Context, id uuid.UUID) (*model.WebhookEndpoint, error) {
	var w model.WebhookEndpoint
	err := r.db.GetContext(ctx, &w,
		`SELECT * FROM webhook_endpoints WHERE id = $1`, id)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	return &w, err
}

func (r *ConnectorRepo) ListWebhooks(ctx context.Context, userID uuid.UUID) ([]model.WebhookEndpoint, error) {
	var webhooks []model.WebhookEndpoint
	err := r.db.SelectContext(ctx, &webhooks,
		`SELECT * FROM webhook_endpoints WHERE user_id = $1 ORDER BY created_at DESC`, userID)
	if err != nil {
		return nil, fmt.Errorf("listing webhooks: %w", err)
	}
	return webhooks, nil
}

func (r *ConnectorRepo) DeleteWebhook(ctx context.Context, id uuid.UUID) error {
	_, err := r.db.ExecContext(ctx, `DELETE FROM webhook_endpoints WHERE id = $1`, id)
	return err
}

func (r *ConnectorRepo) TouchWebhook(ctx context.Context, id uuid.UUID) error {
	_, err := r.db.ExecContext(ctx,
		`UPDATE webhook_endpoints SET last_triggered = NOW() WHERE id = $1`, id)
	return err
}
