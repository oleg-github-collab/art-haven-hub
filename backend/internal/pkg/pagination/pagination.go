package pagination

import (
	"encoding/base64"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
)

type CursorParams struct {
	Cursor string
	Limit  int
}

type CursorData struct {
	CreatedAt time.Time
	ID        uuid.UUID
}

func DefaultLimit(limit int) int {
	if limit <= 0 {
		return 24
	}
	if limit > 100 {
		return 100
	}
	return limit
}

func EncodeCursor(createdAt time.Time, id uuid.UUID) string {
	raw := fmt.Sprintf("%s_%s", createdAt.Format(time.RFC3339Nano), id.String())
	return base64.URLEncoding.EncodeToString([]byte(raw))
}

func DecodeCursor(cursor string) (*CursorData, error) {
	if cursor == "" {
		return nil, nil
	}

	raw, err := base64.URLEncoding.DecodeString(cursor)
	if err != nil {
		return nil, fmt.Errorf("invalid cursor format")
	}

	parts := strings.SplitN(string(raw), "_", 2)
	if len(parts) != 2 {
		return nil, fmt.Errorf("invalid cursor format")
	}

	createdAt, err := time.Parse(time.RFC3339Nano, parts[0])
	if err != nil {
		return nil, fmt.Errorf("invalid cursor timestamp")
	}

	id, err := uuid.Parse(parts[1])
	if err != nil {
		return nil, fmt.Errorf("invalid cursor id")
	}

	return &CursorData{CreatedAt: createdAt, ID: id}, nil
}
