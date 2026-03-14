package model

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

type CartItem struct {
	ID        uuid.UUID `db:"id" json:"id"`
	UserID    uuid.UUID `db:"user_id" json:"user_id"`
	ArtworkID uuid.UUID `db:"artwork_id" json:"artwork_id"`
	Quantity  int       `db:"quantity" json:"quantity"`
	AddedAt   time.Time `db:"added_at" json:"added_at"`

	// Computed
	Artwork *Artwork `db:"-" json:"artwork,omitempty"`
}

type Order struct {
	ID              uuid.UUID        `db:"id" json:"id"`
	BuyerID         uuid.UUID        `db:"buyer_id" json:"buyer_id"`
	Status          string           `db:"status" json:"status"`
	TotalCents      int64            `db:"total_cents" json:"total_cents"`
	CommissionCents int64            `db:"commission_cents" json:"commission_cents"`
	Currency        string           `db:"currency" json:"currency"`
	StripeSessionID *string          `db:"stripe_session_id" json:"-"`
	StripePaymentID *string          `db:"stripe_payment_id" json:"-"`
	ShippingName    *string          `db:"shipping_name" json:"shipping_name,omitempty"`
	ShippingEmail   *string          `db:"shipping_email" json:"shipping_email,omitempty"`
	ShippingPhone   *string          `db:"shipping_phone" json:"shipping_phone,omitempty"`
	ShippingAddress json.RawMessage  `db:"shipping_address" json:"shipping_address,omitempty"`
	ShippingMethod  *string          `db:"shipping_method" json:"shipping_method,omitempty"`
	Notes           *string          `db:"notes" json:"notes,omitempty"`
	PaidAt          *time.Time       `db:"paid_at" json:"paid_at,omitempty"`
	ShippedAt       *time.Time       `db:"shipped_at" json:"shipped_at,omitempty"`
	DeliveredAt     *time.Time       `db:"delivered_at" json:"delivered_at,omitempty"`
	CreatedAt       time.Time        `db:"created_at" json:"created_at"`
	UpdatedAt       time.Time        `db:"updated_at" json:"updated_at"`

	// Computed
	Items []OrderItem `db:"-" json:"items,omitempty"`
}

type OrderItem struct {
	ID              uuid.UUID `db:"id" json:"id"`
	OrderID         uuid.UUID `db:"order_id" json:"order_id"`
	ArtworkID       uuid.UUID `db:"artwork_id" json:"artwork_id"`
	SellerID        uuid.UUID `db:"seller_id" json:"seller_id"`
	Quantity        int       `db:"quantity" json:"quantity"`
	PriceCents      int64     `db:"price_cents" json:"price_cents"`
	CommissionCents int64     `db:"commission_cents" json:"commission_cents"`
	Currency        string    `db:"currency" json:"currency"`

	// Computed
	Artwork *Artwork `db:"-" json:"artwork,omitempty"`
}
