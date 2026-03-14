package repository

import (
	"context"
	"database/sql"
	"errors"

	"github.com/art-haven-hub/backend/internal/model"
	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
)

type BlogRepo struct {
	db *sqlx.DB
}

func NewBlogRepo(db *sqlx.DB) *BlogRepo {
	return &BlogRepo{db: db}
}

func (r *BlogRepo) Create(ctx context.Context, p *model.BlogPost) error {
	query := `INSERT INTO blog_posts (author_id, title, slug, excerpt, content, cover_image, tags, is_published, published_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id, created_at, updated_at`
	return r.db.QueryRowxContext(ctx, query,
		p.AuthorID, p.Title, p.Slug, p.Excerpt, p.Content, p.CoverImage,
		p.Tags, p.IsPublished, p.PublishedAt,
	).Scan(&p.ID, &p.CreatedAt, &p.UpdatedAt)
}

func (r *BlogRepo) GetBySlug(ctx context.Context, slug string) (*model.BlogPost, error) {
	var p model.BlogPost
	err := r.db.GetContext(ctx, &p, `SELECT * FROM blog_posts WHERE slug = $1`, slug)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	return &p, err
}

func (r *BlogRepo) GetByID(ctx context.Context, id uuid.UUID) (*model.BlogPost, error) {
	var p model.BlogPost
	err := r.db.GetContext(ctx, &p, `SELECT * FROM blog_posts WHERE id = $1`, id)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	return &p, err
}

func (r *BlogRepo) List(ctx context.Context, limit, offset int) ([]model.BlogPost, error) {
	var posts []model.BlogPost
	err := r.db.SelectContext(ctx, &posts,
		`SELECT * FROM blog_posts WHERE is_published = TRUE ORDER BY published_at DESC LIMIT $1 OFFSET $2`,
		limit, offset)
	if posts == nil {
		posts = []model.BlogPost{}
	}
	return posts, err
}

func (r *BlogRepo) Update(ctx context.Context, p *model.BlogPost) error {
	_, err := r.db.ExecContext(ctx,
		`UPDATE blog_posts SET title=$2, slug=$3, excerpt=$4, content=$5, cover_image=$6,
		 tags=$7, is_published=$8, published_at=$9 WHERE id = $1`,
		p.ID, p.Title, p.Slug, p.Excerpt, p.Content, p.CoverImage,
		p.Tags, p.IsPublished, p.PublishedAt)
	return err
}

func (r *BlogRepo) Delete(ctx context.Context, id uuid.UUID) error {
	_, err := r.db.ExecContext(ctx, `DELETE FROM blog_posts WHERE id = $1`, id)
	return err
}

func (r *BlogRepo) IncrementViewCount(ctx context.Context, id uuid.UUID) error {
	_, err := r.db.ExecContext(ctx,
		`UPDATE blog_posts SET view_count = view_count + 1 WHERE id = $1`, id)
	return err
}
