package model

import (
	"time"

	"github.com/google/uuid"
)

type Subscription struct {
	ID                   uuid.UUID  `db:"id" json:"id"`
	UserID               uuid.UUID  `db:"user_id" json:"user_id"`
	Plan                 string     `db:"plan" json:"plan"` // free, pro, gallery
	StripeCustomerID     *string    `db:"stripe_customer_id" json:"-"`
	StripeSubscriptionID *string    `db:"stripe_subscription_id" json:"-"`
	Status               string     `db:"status" json:"status"` // active, cancelled, past_due
	CurrentPeriodEnd     *time.Time `db:"current_period_end" json:"current_period_end,omitempty"`
	CreatedAt            time.Time  `db:"created_at" json:"created_at"`
	UpdatedAt            time.Time  `db:"updated_at" json:"updated_at"`
}

type SubscriptionPlan struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	PriceCents  int64  `json:"price_cents"`
	Currency    string `json:"currency"`
	Interval    string `json:"interval"` // month
	Features    []string `json:"features"`
	StripePriceID string `json:"-"`
}
