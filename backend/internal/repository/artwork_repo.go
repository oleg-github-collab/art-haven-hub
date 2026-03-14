package repository

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"

	"github.com/art-haven-hub/backend/internal/model"
	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
)

type ArtworkRepo struct {
	db *sqlx.DB
}

func NewArtworkRepo(db *sqlx.DB) *ArtworkRepo {
	return &ArtworkRepo{db: db}
}

type ArtworkFilter struct {
	Category  string
	Condition string
	Country   string
	City      string
	MinPrice  *int64
	MaxPrice  *int64
	ArtistID  *uuid.UUID
	Status    string
	Search    string
	Tags      []string
	Sort      string // newest, price_asc, price_desc, popular
	Cursor    string
	Limit     int
}

type ArtworkListResult struct {
	Items      []model.Artwork `json:"items"`
	NextCursor string          `json:"next_cursor,omitempty"`
	Total      int64           `json:"total"`
}

func (r *ArtworkRepo) Create(ctx context.Context, a *model.Artwork) error {
	query := `
		INSERT INTO artworks (
			title, description, full_description, price_cents, currency,
			artist_id, category_id, subcategory, condition, status,
			images, emoji, width_cm, height_cm, tags,
			is_biddable, shipping_options, return_policy, city, country
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
			$11, $12, $13, $14, $15, $16, $17, $18, $19, $20
		) RETURNING id, created_at, updated_at`

	return r.db.QueryRowxContext(ctx, query,
		a.Title, a.Description, a.FullDescription, a.PriceCents, a.Currency,
		a.ArtistID, a.CategoryID, a.Subcategory, a.Condition, a.Status,
		a.Images, a.Emoji, a.WidthCm, a.HeightCm, a.Tags,
		a.IsBiddable, a.ShippingOptions, a.ReturnPolicy, a.City, a.Country,
	).Scan(&a.ID, &a.CreatedAt, &a.UpdatedAt)
}

func (r *ArtworkRepo) GetByID(ctx context.Context, id uuid.UUID) (*model.Artwork, error) {
	var a model.Artwork
	err := r.db.GetContext(ctx, &a, `SELECT * FROM artworks WHERE id = $1`, id)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	return &a, err
}

func (r *ArtworkRepo) Update(ctx context.Context, a *model.Artwork) error {
	query := `
		UPDATE artworks SET
			title = $2, description = $3, full_description = $4,
			price_cents = $5, currency = $6, category_id = $7,
			subcategory = $8, condition = $9, status = $10,
			images = $11, emoji = $12, width_cm = $13, height_cm = $14,
			tags = $15, is_biddable = $16, shipping_options = $17,
			return_policy = $18, city = $19, country = $20
		WHERE id = $1`

	result, err := r.db.ExecContext(ctx, query,
		a.ID, a.Title, a.Description, a.FullDescription,
		a.PriceCents, a.Currency, a.CategoryID,
		a.Subcategory, a.Condition, a.Status,
		a.Images, a.Emoji, a.WidthCm, a.HeightCm,
		a.Tags, a.IsBiddable, a.ShippingOptions,
		a.ReturnPolicy, a.City, a.Country,
	)
	if err != nil {
		return err
	}
	rows, _ := result.RowsAffected()
	if rows == 0 {
		return fmt.Errorf("artwork not found")
	}
	return nil
}

func (r *ArtworkRepo) Delete(ctx context.Context, id uuid.UUID) error {
	result, err := r.db.ExecContext(ctx, `DELETE FROM artworks WHERE id = $1`, id)
	if err != nil {
		return err
	}
	rows, _ := result.RowsAffected()
	if rows == 0 {
		return fmt.Errorf("artwork not found")
	}
	return nil
}

func (r *ArtworkRepo) List(ctx context.Context, f ArtworkFilter) (*ArtworkListResult, error) {
	var conditions []string
	var args []interface{}
	argN := 1

	// Default: only active/promoted
	if f.Status != "" {
		conditions = append(conditions, fmt.Sprintf("a.status = $%d", argN))
		args = append(args, f.Status)
		argN++
	} else {
		conditions = append(conditions, "a.status IN ('active', 'promoted')")
	}

	if f.Category != "" {
		conditions = append(conditions, fmt.Sprintf("a.category_id = $%d", argN))
		args = append(args, f.Category)
		argN++
	}
	if f.Condition != "" {
		conditions = append(conditions, fmt.Sprintf("a.condition = $%d", argN))
		args = append(args, f.Condition)
		argN++
	}
	if f.Country != "" {
		conditions = append(conditions, fmt.Sprintf("a.country = $%d", argN))
		args = append(args, f.Country)
		argN++
	}
	if f.City != "" {
		conditions = append(conditions, fmt.Sprintf("a.city ILIKE $%d", argN))
		args = append(args, "%"+f.City+"%")
		argN++
	}
	if f.MinPrice != nil {
		conditions = append(conditions, fmt.Sprintf("a.price_cents >= $%d", argN))
		args = append(args, *f.MinPrice)
		argN++
	}
	if f.MaxPrice != nil {
		conditions = append(conditions, fmt.Sprintf("a.price_cents <= $%d", argN))
		args = append(args, *f.MaxPrice)
		argN++
	}
	if f.ArtistID != nil {
		conditions = append(conditions, fmt.Sprintf("a.artist_id = $%d", argN))
		args = append(args, *f.ArtistID)
		argN++
	}
	if f.Search != "" {
		conditions = append(conditions, fmt.Sprintf(
			"(a.title ILIKE $%d OR a.description ILIKE $%d)", argN, argN))
		args = append(args, "%"+f.Search+"%")
		argN++
	}
	if len(f.Tags) > 0 {
		conditions = append(conditions, fmt.Sprintf("a.tags && $%d", argN))
		args = append(args, model.StringArray(f.Tags))
		argN++
	}

	where := "WHERE " + strings.Join(conditions, " AND ")

	// Count
	countQuery := "SELECT COUNT(*) FROM artworks a " + where
	var total int64
	if err := r.db.GetContext(ctx, &total, countQuery, args...); err != nil {
		return nil, fmt.Errorf("counting artworks: %w", err)
	}

	// Sort
	orderBy := "ORDER BY a.is_promoted DESC, a.created_at DESC"
	switch f.Sort {
	case "price_asc":
		orderBy = "ORDER BY a.price_cents ASC"
	case "price_desc":
		orderBy = "ORDER BY a.price_cents DESC"
	case "popular":
		orderBy = "ORDER BY a.view_count DESC, a.like_count DESC"
	case "newest":
		orderBy = "ORDER BY a.created_at DESC"
	}

	if f.Limit <= 0 || f.Limit > 50 {
		f.Limit = 24
	}

	query := fmt.Sprintf("SELECT a.* FROM artworks a %s %s LIMIT $%d", where, orderBy, argN)
	args = append(args, f.Limit+1) // fetch one extra for next cursor

	var artworks []model.Artwork
	if err := r.db.SelectContext(ctx, &artworks, query, args...); err != nil {
		return nil, fmt.Errorf("listing artworks: %w", err)
	}

	var nextCursor string
	if len(artworks) > f.Limit {
		last := artworks[f.Limit-1]
		nextCursor = last.ID.String()
		artworks = artworks[:f.Limit]
	}

	return &ArtworkListResult{
		Items:      artworks,
		NextCursor: nextCursor,
		Total:      total,
	}, nil
}

func (r *ArtworkRepo) UpdateStatus(ctx context.Context, id uuid.UUID, status string) error {
	_, err := r.db.ExecContext(ctx,
		`UPDATE artworks SET status = $2 WHERE id = $1`, id, status)
	return err
}

func (r *ArtworkRepo) IncrementViewCount(ctx context.Context, id uuid.UUID) error {
	_, err := r.db.ExecContext(ctx,
		`UPDATE artworks SET view_count = view_count + 1 WHERE id = $1`, id)
	return err
}

// --- Categories ---

func (r *ArtworkRepo) GetCategories(ctx context.Context) ([]model.Category, error) {
	var cats []model.Category
	err := r.db.SelectContext(ctx, &cats, `SELECT * FROM categories ORDER BY sort`)
	return cats, err
}

// --- Reviews ---

func (r *ArtworkRepo) CreateReview(ctx context.Context, rev *model.ArtworkReview) error {
	query := `
		INSERT INTO artwork_reviews (artwork_id, user_id, rating, comment)
		VALUES ($1, $2, $3, $4)
		RETURNING id, created_at, updated_at`
	return r.db.QueryRowxContext(ctx, query,
		rev.ArtworkID, rev.UserID, rev.Rating, rev.Comment,
	).Scan(&rev.ID, &rev.CreatedAt, &rev.UpdatedAt)
}

func (r *ArtworkRepo) GetReviews(ctx context.Context, artworkID uuid.UUID, limit, offset int) ([]model.ArtworkReview, error) {
	var reviews []model.ArtworkReview
	err := r.db.SelectContext(ctx, &reviews,
		`SELECT * FROM artwork_reviews WHERE artwork_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
		artworkID, limit, offset)
	return reviews, err
}

func (r *ArtworkRepo) GetAvgRating(ctx context.Context, artworkID uuid.UUID) (float64, int, error) {
	var result struct {
		Avg   float64 `db:"avg"`
		Count int     `db:"count"`
	}
	err := r.db.GetContext(ctx, &result,
		`SELECT COALESCE(AVG(rating), 0) as avg, COUNT(*) as count FROM artwork_reviews WHERE artwork_id = $1`,
		artworkID)
	return result.Avg, result.Count, err
}

// --- Favorites ---

func (r *ArtworkRepo) AddFavorite(ctx context.Context, userID, artworkID uuid.UUID) error {
	_, err := r.db.ExecContext(ctx,
		`INSERT INTO artwork_favorites (user_id, artwork_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
		userID, artworkID)
	if err == nil {
		r.db.ExecContext(ctx, `UPDATE artworks SET like_count = like_count + 1 WHERE id = $1`, artworkID)
	}
	return err
}

func (r *ArtworkRepo) RemoveFavorite(ctx context.Context, userID, artworkID uuid.UUID) error {
	result, err := r.db.ExecContext(ctx,
		`DELETE FROM artwork_favorites WHERE user_id = $1 AND artwork_id = $2`,
		userID, artworkID)
	if err != nil {
		return err
	}
	if rows, _ := result.RowsAffected(); rows > 0 {
		r.db.ExecContext(ctx, `UPDATE artworks SET like_count = GREATEST(like_count - 1, 0) WHERE id = $1`, artworkID)
	}
	return nil
}

func (r *ArtworkRepo) IsFavorited(ctx context.Context, userID, artworkID uuid.UUID) (bool, error) {
	var exists bool
	err := r.db.GetContext(ctx, &exists,
		`SELECT EXISTS(SELECT 1 FROM artwork_favorites WHERE user_id = $1 AND artwork_id = $2)`,
		userID, artworkID)
	return exists, err
}

func (r *ArtworkRepo) GetUserFavorites(ctx context.Context, userID uuid.UUID, limit, offset int) ([]model.Artwork, error) {
	var artworks []model.Artwork
	err := r.db.SelectContext(ctx, &artworks,
		`SELECT a.* FROM artworks a
		 JOIN artwork_favorites f ON f.artwork_id = a.id
		 WHERE f.user_id = $1
		 ORDER BY f.created_at DESC
		 LIMIT $2 OFFSET $3`,
		userID, limit, offset)
	return artworks, err
}

// --- Artist lookup (for embedding in artwork responses) ---

func (r *ArtworkRepo) GetArtistByID(ctx context.Context, id uuid.UUID) (*model.User, error) {
	var u model.User
	err := r.db.GetContext(ctx, &u,
		`SELECT id, name, handle, avatar_url, is_verified FROM users WHERE id = $1`, id)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	return &u, err
}
