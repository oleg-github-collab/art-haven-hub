package model

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

// ─── Social Account ─────────────────────────────────────────

type SocialAccount struct {
	ID        uuid.UUID       `db:"id" json:"id"`
	UserID    uuid.UUID       `db:"user_id" json:"user_id"`
	Platform  string          `db:"platform" json:"platform"`
	Handle    string          `db:"handle" json:"handle"`
	Connected bool            `db:"connected" json:"connected"`
	Followers int             `db:"followers" json:"followers"`
	AutoPost  bool            `db:"auto_post" json:"auto_post"`
	Meta      json.RawMessage `db:"meta" json:"meta,omitempty"`
	CreatedAt time.Time       `db:"created_at" json:"created_at"`
	UpdatedAt time.Time       `db:"updated_at" json:"updated_at"`
}

// ─── Scheduled Post ─────────────────────────────────────────

type ScheduledPost struct {
	ID         uuid.UUID       `db:"id" json:"id"`
	UserID     uuid.UUID       `db:"user_id" json:"user_id"`
	Title      string          `db:"title" json:"title"`
	Platform   string          `db:"platform" json:"platform"`
	Caption    string          `db:"caption" json:"caption"`
	Date       string          `db:"date" json:"date"`   // YYYY-MM-DD
	Time       string          `db:"time" json:"time"`   // HH:mm
	Status     string          `db:"status" json:"status"`
	Retries    int             `db:"retries" json:"retries"`
	ArtworkID  *uuid.UUID      `db:"artwork_id" json:"artwork_id,omitempty"`
	CampaignID *uuid.UUID      `db:"campaign_id" json:"campaign_id,omitempty"`
	Meta       json.RawMessage `db:"meta" json:"meta,omitempty"`
	CreatedAt  time.Time       `db:"created_at" json:"created_at"`
	UpdatedAt  time.Time       `db:"updated_at" json:"updated_at"`
}

// ─── Campaign ───────────────────────────────────────────────

type Campaign struct {
	ID          uuid.UUID    `db:"id" json:"id"`
	UserID      uuid.UUID    `db:"user_id" json:"user_id"`
	Name        string       `db:"name" json:"name"`
	Platforms   StringArray  `db:"platforms" json:"platforms"`
	Status      string       `db:"status" json:"status"`
	ScheduledAt *time.Time   `db:"scheduled_at" json:"scheduled_at,omitempty"`
	Reach       int          `db:"reach" json:"reach"`
	Engagement  int          `db:"engagement" json:"engagement"`
	Meta        json.RawMessage `db:"meta" json:"meta,omitempty"`
	CreatedAt   time.Time    `db:"created_at" json:"created_at"`
	UpdatedAt   time.Time    `db:"updated_at" json:"updated_at"`
}

// ─── Workflow ───────────────────────────────────────────────

type Workflow struct {
	ID            uuid.UUID       `db:"id" json:"id"`
	UserID        uuid.UUID       `db:"user_id" json:"user_id"`
	Name          string          `db:"name" json:"name"`
	Description   string          `db:"description" json:"description"`
	Icon          string          `db:"icon" json:"icon"`
	Nodes         json.RawMessage `db:"nodes" json:"nodes"`
	Connections   json.RawMessage `db:"connections" json:"connections"`
	IsPublic      bool            `db:"is_public" json:"is_public"`
	TriggerType   string          `db:"trigger_type" json:"trigger_type"`
	TriggerConfig *json.RawMessage `db:"trigger_config" json:"trigger_config,omitempty"`
	IsActive      bool            `db:"is_active" json:"is_active"`
	LastRunAt     *time.Time      `db:"last_run_at" json:"last_run_at,omitempty"`
	RunCount      int             `db:"run_count" json:"run_count"`
	CreatedAt     time.Time       `db:"created_at" json:"created_at"`
	UpdatedAt     time.Time       `db:"updated_at" json:"updated_at"`
}
