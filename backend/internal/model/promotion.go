package model

import (
	"time"

	"github.com/google/uuid"
)

type Promotion struct {
	ID              uuid.UUID  `db:"id" json:"id"`
	ArtworkID       uuid.UUID  `db:"artwork_id" json:"artwork_id"`
	UserID          uuid.UUID  `db:"user_id" json:"user_id"`
	DurationDays    int        `db:"duration_days" json:"duration_days"`
	PriceCents      int64      `db:"price_cents" json:"price_cents"`
	Currency        string     `db:"currency" json:"currency"`
	StripeSessionID *string    `db:"stripe_session_id" json:"-"`
	Status          string     `db:"status" json:"status"` // pending, active, expired, cancelled
	StartsAt        *time.Time `db:"starts_at" json:"starts_at,omitempty"`
	EndsAt          *time.Time `db:"ends_at" json:"ends_at,omitempty"`
	CreatedAt       time.Time  `db:"created_at" json:"created_at"`
}

type PromotionPricing struct {
	Days  int   `json:"days"`
	Price int64 `json:"price_cents"`
}
