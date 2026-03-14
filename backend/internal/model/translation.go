package model

import (
	"time"

	"github.com/google/uuid"
)

type TranslationJob struct {
	ID             uuid.UUID `json:"id"`
	ArtworkID      uuid.UUID `json:"artwork_id"`
	TargetLanguage string    `json:"target_language"`
	Status         string    `json:"status"` // pending, processing, completed, failed
	Result         string    `json:"result,omitempty"`
	CreatedAt      time.Time `json:"created_at"`
}
