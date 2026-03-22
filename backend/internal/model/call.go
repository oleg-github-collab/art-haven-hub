package model

import (
	"time"

	"github.com/google/uuid"
)

type Call struct {
	ID             uuid.UUID  `db:"id" json:"id"`
	ConversationID uuid.UUID  `db:"conversation_id" json:"conversation_id"`
	CallerID       uuid.UUID  `db:"caller_id" json:"caller_id"`
	CalleeID       uuid.UUID  `db:"callee_id" json:"callee_id"`
	CallType       string     `db:"call_type" json:"call_type"`
	Status         string     `db:"status" json:"status"`
	StartedAt      *time.Time `db:"started_at" json:"started_at,omitempty"`
	EndedAt        *time.Time `db:"ended_at" json:"ended_at,omitempty"`
	DurationSecs   int        `db:"duration_secs" json:"duration_secs"`
	EndReason      *string    `db:"end_reason" json:"end_reason,omitempty"`
	CreatedAt      time.Time  `db:"created_at" json:"created_at"`
	UpdatedAt      time.Time  `db:"updated_at" json:"updated_at"`

	// Computed
	Caller *User `db:"-" json:"caller,omitempty"`
	Callee *User `db:"-" json:"callee,omitempty"`
}
