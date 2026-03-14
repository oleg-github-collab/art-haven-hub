package repository

import (
	"context"
	"fmt"

	"github.com/art-haven-hub/backend/internal/model"
	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
)

type UploadRepo struct {
	db *sqlx.DB
}

func NewUploadRepo(db *sqlx.DB) *UploadRepo {
	return &UploadRepo{db: db}
}

func (r *UploadRepo) Create(ctx context.Context, upload *model.Upload) error {
	upload.ID = uuid.New()
	_, err := r.db.NamedExecContext(ctx, `
		INSERT INTO uploads (id, user_id, filename, original_name, mime_type, size_bytes, path, url)
		VALUES (:id, :user_id, :filename, :original_name, :mime_type, :size_bytes, :path, :url)
	`, upload)
	if err != nil {
		return fmt.Errorf("creating upload: %w", err)
	}
	return nil
}

func (r *UploadRepo) GetByID(ctx context.Context, id uuid.UUID) (*model.Upload, error) {
	var upload model.Upload
	err := r.db.GetContext(ctx, &upload, `SELECT * FROM uploads WHERE id = $1`, id)
	if err != nil {
		return nil, fmt.Errorf("getting upload: %w", err)
	}
	return &upload, nil
}

func (r *UploadRepo) Delete(ctx context.Context, id uuid.UUID) error {
	_, err := r.db.ExecContext(ctx, `DELETE FROM uploads WHERE id = $1`, id)
	return err
}
