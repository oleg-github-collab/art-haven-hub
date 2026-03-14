package model

import (
	"time"

	"github.com/google/uuid"
)

type Upload struct {
	ID           uuid.UUID `db:"id" json:"id"`
	UserID       uuid.UUID `db:"user_id" json:"user_id"`
	Filename     string    `db:"filename" json:"filename"`
	OriginalName string    `db:"original_name" json:"original_name"`
	MimeType     string    `db:"mime_type" json:"mime_type"`
	SizeBytes    int64     `db:"size_bytes" json:"size_bytes"`
	Path         string    `db:"path" json:"-"`
	URL          string    `db:"url" json:"url"`
	CreatedAt    time.Time `db:"created_at" json:"created_at"`
}
