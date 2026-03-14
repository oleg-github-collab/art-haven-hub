package repository

import (
	"context"
	"database/sql"
	"errors"

	"github.com/art-haven-hub/backend/internal/model"
	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
)

type BoardRepo struct {
	db *sqlx.DB
}

func NewBoardRepo(db *sqlx.DB) *BoardRepo {
	return &BoardRepo{db: db}
}

func (r *BoardRepo) CreateAnnouncement(ctx context.Context, a *model.Announcement) error {
	query := `INSERT INTO announcements (author_id, type, title, description, category, location, budget, images, tags, expires_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id, created_at, updated_at`
	return r.db.QueryRowxContext(ctx, query,
		a.AuthorID, a.Type, a.Title, a.Description, a.Category,
		a.Location, a.Budget, a.Images, a.Tags, a.ExpiresAt,
	).Scan(&a.ID, &a.CreatedAt, &a.UpdatedAt)
}

func (r *BoardRepo) GetAnnouncement(ctx context.Context, id uuid.UUID) (*model.Announcement, error) {
	var a model.Announcement
	err := r.db.GetContext(ctx, &a, `SELECT * FROM announcements WHERE id = $1`, id)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	return &a, err
}

func (r *BoardRepo) ListAnnouncements(ctx context.Context, annType string, limit, offset int) ([]model.Announcement, error) {
	var anns []model.Announcement
	var err error
	if annType != "" {
		err = r.db.SelectContext(ctx, &anns,
			`SELECT * FROM announcements WHERE is_active = TRUE AND type = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
			annType, limit, offset)
	} else {
		err = r.db.SelectContext(ctx, &anns,
			`SELECT * FROM announcements WHERE is_active = TRUE ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
			limit, offset)
	}
	if anns == nil {
		anns = []model.Announcement{}
	}
	return anns, err
}

func (r *BoardRepo) UpdateAnnouncement(ctx context.Context, a *model.Announcement) error {
	_, err := r.db.ExecContext(ctx,
		`UPDATE announcements SET title = $2, description = $3, category = $4, location = $5,
		 budget = $6, images = $7, tags = $8, is_active = $9 WHERE id = $1`,
		a.ID, a.Title, a.Description, a.Category, a.Location, a.Budget, a.Images, a.Tags, a.IsActive)
	return err
}

func (r *BoardRepo) DeleteAnnouncement(ctx context.Context, id uuid.UUID) error {
	_, err := r.db.ExecContext(ctx, `DELETE FROM announcements WHERE id = $1`, id)
	return err
}

func (r *BoardRepo) GetAuthor(ctx context.Context, id uuid.UUID) (*model.User, error) {
	var u model.User
	err := r.db.GetContext(ctx, &u,
		`SELECT id, name, handle, avatar_url, is_verified FROM users WHERE id = $1`, id)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	return &u, err
}
