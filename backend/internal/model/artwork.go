package model

import (
	"time"

	"github.com/google/uuid"
)

type Artwork struct {
	ID               uuid.UUID    `db:"id" json:"id"`
	Title            string       `db:"title" json:"title"`
	Description      *string      `db:"description" json:"description,omitempty"`
	FullDescription  *string      `db:"full_description" json:"full_description,omitempty"`
	PriceCents       int64        `db:"price_cents" json:"price_cents"`
	Currency         string       `db:"currency" json:"currency"`
	ArtistID         uuid.UUID    `db:"artist_id" json:"artist_id"`
	CategoryID       string       `db:"category_id" json:"category_id"`
	Subcategory      *string      `db:"subcategory" json:"subcategory,omitempty"`
	Condition        *string      `db:"condition" json:"condition,omitempty"`
	Status           string       `db:"status" json:"status"`
	Images           StringArray  `db:"images" json:"images"`
	Emoji            *string      `db:"emoji" json:"emoji,omitempty"`
	WidthCm          *float64     `db:"width_cm" json:"width_cm,omitempty"`
	HeightCm         *float64     `db:"height_cm" json:"height_cm,omitempty"`
	Tags             StringArray  `db:"tags" json:"tags"`
	ViewCount        int          `db:"view_count" json:"view_count"`
	LikeCount        int          `db:"like_count" json:"like_count"`
	IsBiddable       bool         `db:"is_biddable" json:"is_biddable"`
	CurrentBidCents  int64        `db:"current_bid_cents" json:"current_bid_cents,omitempty"`
	BidCount         int          `db:"bid_count" json:"bid_count,omitempty"`
	ShippingOptions  StringArray  `db:"shipping_options" json:"shipping_options"`
	ReturnPolicy     *string      `db:"return_policy" json:"return_policy,omitempty"`
	City             *string      `db:"city" json:"city,omitempty"`
	Country          *string      `db:"country" json:"country,omitempty"`
	IsPromoted       bool         `db:"is_promoted" json:"is_promoted"`
	PromotedUntil    *time.Time   `db:"promoted_until" json:"promoted_until,omitempty"`
	IsFeatured       bool         `db:"is_featured" json:"is_featured"`
	CreatedAt        time.Time    `db:"created_at" json:"created_at"`
	UpdatedAt        time.Time    `db:"updated_at" json:"updated_at"`

	// Computed
	Artist       *User    `db:"-" json:"artist,omitempty"`
	IsFavorited  bool     `db:"-" json:"is_favorited,omitempty"`
	AvgRating    float64  `db:"-" json:"avg_rating,omitempty"`
	ReviewCount  int      `db:"-" json:"review_count,omitempty"`
}

type Category struct {
	ID    string `db:"id" json:"id"`
	Label string `db:"label" json:"label"`
	Sort  int    `db:"sort" json:"sort"`
}

type ArtworkReview struct {
	ID        uuid.UUID `db:"id" json:"id"`
	ArtworkID uuid.UUID `db:"artwork_id" json:"artwork_id"`
	UserID    uuid.UUID `db:"user_id" json:"user_id"`
	Rating    int       `db:"rating" json:"rating"`
	Comment   *string   `db:"comment" json:"comment,omitempty"`
	CreatedAt time.Time `db:"created_at" json:"created_at"`
	UpdatedAt time.Time `db:"updated_at" json:"updated_at"`

	// Computed
	User *User `db:"-" json:"user,omitempty"`
}

type ArtworkFavorite struct {
	ID        uuid.UUID `db:"id" json:"id"`
	ArtworkID uuid.UUID `db:"artwork_id" json:"artwork_id"`
	UserID    uuid.UUID `db:"user_id" json:"user_id"`
	CreatedAt time.Time `db:"created_at" json:"created_at"`
}
