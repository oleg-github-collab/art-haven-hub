package model

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

// ─── Connector ──────────────────────────────────────────────

type Connector struct {
	ID          uuid.UUID       `db:"id" json:"id"`
	UserID      uuid.UUID       `db:"user_id" json:"user_id"`
	Platform    string          `db:"platform" json:"platform"`
	Credentials json.RawMessage `db:"credentials" json:"-"`
	Status      string          `db:"status" json:"status"`
	Scopes      StringArray     `db:"scopes" json:"scopes,omitempty"`
	Meta        json.RawMessage `db:"meta" json:"meta,omitempty"`
	CreatedAt   time.Time       `db:"created_at" json:"created_at"`
	UpdatedAt   time.Time       `db:"updated_at" json:"updated_at"`
}

// ─── Workflow Execution ─────────────────────────────────────

type WorkflowExecution struct {
	ID          uuid.UUID  `db:"id" json:"id"`
	WorkflowID  uuid.UUID  `db:"workflow_id" json:"workflow_id"`
	UserID      uuid.UUID  `db:"user_id" json:"user_id"`
	TriggerType string     `db:"trigger_type" json:"trigger_type"`
	Status      string     `db:"status" json:"status"`
	StartedAt   *time.Time `db:"started_at" json:"started_at,omitempty"`
	CompletedAt *time.Time `db:"completed_at" json:"completed_at,omitempty"`
	Error       *string    `db:"error" json:"error,omitempty"`
	CreatedAt   time.Time  `db:"created_at" json:"created_at"`

	// Joined fields (not in DB)
	NodeLogs []ExecutionNodeLog `db:"-" json:"node_logs,omitempty"`
}

// ─── Execution Node Log ─────────────────────────────────────

type ExecutionNodeLog struct {
	ID          uuid.UUID       `db:"id" json:"id"`
	ExecutionID uuid.UUID       `db:"execution_id" json:"execution_id"`
	NodeID      string          `db:"node_id" json:"node_id"`
	NodeType    string          `db:"node_type" json:"node_type"`
	Status      string          `db:"status" json:"status"`
	InputData   json.RawMessage `db:"input_data" json:"input_data,omitempty"`
	OutputData  json.RawMessage `db:"output_data" json:"output_data,omitempty"`
	Error       *string         `db:"error" json:"error,omitempty"`
	StartedAt   *time.Time      `db:"started_at" json:"started_at,omitempty"`
	CompletedAt *time.Time      `db:"completed_at" json:"completed_at,omitempty"`
	DurationMs  int             `db:"duration_ms" json:"duration_ms"`
}

// ─── Webhook Endpoint ───────────────────────────────────────

type WebhookEndpoint struct {
	ID            uuid.UUID  `db:"id" json:"id"`
	UserID        uuid.UUID  `db:"user_id" json:"user_id"`
	WorkflowID    uuid.UUID  `db:"workflow_id" json:"workflow_id"`
	Secret        string     `db:"secret" json:"-"`
	IsActive      bool       `db:"is_active" json:"is_active"`
	LastTriggered *time.Time `db:"last_triggered" json:"last_triggered,omitempty"`
	CreatedAt     time.Time  `db:"created_at" json:"created_at"`
}
