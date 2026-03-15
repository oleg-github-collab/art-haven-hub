package model

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

type Announcement struct {
	ID          uuid.UUID   `db:"id" json:"id"`
	AuthorID    uuid.UUID   `db:"author_id" json:"author_id"`
	Type        string      `db:"type" json:"type"`
	Title       string      `db:"title" json:"title"`
	Description string      `db:"description" json:"description"`
	Category    *string     `db:"category" json:"category,omitempty"`
	Location    *string     `db:"location" json:"location,omitempty"`
	Budget      *string     `db:"budget" json:"budget,omitempty"`
	Images      StringArray `db:"images" json:"images"`
	Tags        StringArray `db:"tags" json:"tags"`
	IsActive    bool        `db:"is_active" json:"is_active"`
	ExpiresAt   *time.Time  `db:"expires_at" json:"expires_at,omitempty"`
	Embedding   *string     `db:"embedding" json:"-"`
	CreatedAt   time.Time   `db:"created_at" json:"created_at"`
	UpdatedAt   time.Time   `db:"updated_at" json:"updated_at"`

	Author *User `db:"-" json:"author,omitempty"`
}

type Event struct {
	ID            uuid.UUID   `db:"id" json:"id"`
	OrganizerID   uuid.UUID   `db:"organizer_id" json:"organizer_id"`
	Title         string      `db:"title" json:"title"`
	Description   string      `db:"description" json:"description"`
	EventType     string      `db:"event_type" json:"event_type"`
	Location      *string     `db:"location" json:"location,omitempty"`
	Address       *string     `db:"address" json:"address,omitempty"`
	City          *string     `db:"city" json:"city,omitempty"`
	Country       *string     `db:"country" json:"country,omitempty"`
	IsOnline      bool        `db:"is_online" json:"is_online"`
	OnlineURL     *string     `db:"online_url" json:"online_url,omitempty"`
	CoverImage    *string     `db:"cover_image" json:"cover_image,omitempty"`
	Images        StringArray `db:"images" json:"images"`
	StartsAt      time.Time   `db:"starts_at" json:"starts_at"`
	EndsAt        *time.Time  `db:"ends_at" json:"ends_at,omitempty"`
	PriceCents    int64       `db:"price_cents" json:"price_cents"`
	Currency      string      `db:"currency" json:"currency"`
	MaxAttendees  *int        `db:"max_attendees" json:"max_attendees,omitempty"`
	AttendeeCount int         `db:"attendee_count" json:"attendee_count"`
	Tags          StringArray `db:"tags" json:"tags"`
	IsFeatured    bool        `db:"is_featured" json:"is_featured"`
	CreatedAt     time.Time   `db:"created_at" json:"created_at"`
	UpdatedAt     time.Time   `db:"updated_at" json:"updated_at"`

	Organizer  *User  `db:"-" json:"organizer,omitempty"`
	IsAttending bool   `db:"-" json:"is_attending,omitempty"`
}

type BlogPost struct {
	ID          uuid.UUID   `db:"id" json:"id"`
	AuthorID    uuid.UUID   `db:"author_id" json:"author_id"`
	Title       string      `db:"title" json:"title"`
	Slug        string      `db:"slug" json:"slug"`
	Excerpt     *string     `db:"excerpt" json:"excerpt,omitempty"`
	Content     string      `db:"content" json:"content"`
	CoverImage  *string     `db:"cover_image" json:"cover_image,omitempty"`
	Tags        StringArray `db:"tags" json:"tags"`
	IsPublished bool        `db:"is_published" json:"is_published"`
	PublishedAt *time.Time  `db:"published_at" json:"published_at,omitempty"`
	ViewCount    int              `db:"view_count" json:"view_count"`
	Translations json.RawMessage  `db:"translations" json:"translations,omitempty"`
	CreatedAt    time.Time        `db:"created_at" json:"created_at"`
	UpdatedAt    time.Time        `db:"updated_at" json:"updated_at"`

	Author *User `db:"-" json:"author,omitempty"`
}
