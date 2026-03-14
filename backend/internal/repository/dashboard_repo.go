package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
)

type DashboardRepo struct {
	db *sqlx.DB
}

func NewDashboardRepo(db *sqlx.DB) *DashboardRepo {
	return &DashboardRepo{db: db}
}

type DashboardStats struct {
	Total   int   `json:"total" db:"total"`
	Active  int   `json:"active" db:"active"`
	Sold    int   `json:"sold" db:"sold"`
	Views   int64 `json:"views" db:"views"`
	Likes   int64 `json:"likes" db:"likes"`
	Revenue int64 `json:"revenue" db:"revenue"`
}

type DataPoint struct {
	Label string `json:"label" db:"label"`
	Value int64  `json:"value" db:"value"`
}

func (r *DashboardRepo) GetStats(ctx context.Context, artistID uuid.UUID) (*DashboardStats, error) {
	stats := &DashboardStats{}

	err := r.db.GetContext(ctx, stats, `
		SELECT
			COUNT(*) AS total,
			COUNT(*) FILTER (WHERE status IN ('active','promoted')) AS active,
			COUNT(*) FILTER (WHERE status = 'sold') AS sold,
			COALESCE(SUM(view_count), 0) AS views,
			COALESCE(SUM(like_count), 0) AS likes,
			COALESCE((
				SELECT SUM(oi.price_cents)
				FROM order_items oi
				JOIN orders o ON o.id = oi.order_id
				WHERE oi.artwork_id IN (SELECT id FROM artworks WHERE artist_id = $1)
				  AND o.status = 'paid'
			), 0) AS revenue
		FROM artworks
		WHERE artist_id = $1
	`, artistID)
	if err != nil {
		return nil, fmt.Errorf("getting dashboard stats: %w", err)
	}

	return stats, nil
}

type DashboardArtwork struct {
	ID           uuid.UUID  `json:"id" db:"id"`
	Title        string     `json:"title" db:"title"`
	Price        int64      `json:"price" db:"price_cents"`
	Status       string     `json:"status" db:"status"`
	Views        int        `json:"views" db:"view_count"`
	Likes        int        `json:"likes" db:"like_count"`
	CreatedAt    time.Time  `json:"created_at" db:"created_at"`
	CoverImage   *string    `json:"cover_image" db:"cover_image"`
	IsPromoted   bool       `json:"is_promoted" db:"is_promoted"`
	PromotedUtil *time.Time `json:"promoted_until,omitempty" db:"promoted_until"`
}

func (r *DashboardRepo) GetArtworks(ctx context.Context, artistID uuid.UUID, status string, limit, offset int) ([]DashboardArtwork, error) {
	query := `
		SELECT id, title, price_cents, status, view_count, like_count, created_at,
		       cover_image, is_promoted, promoted_until
		FROM artworks
		WHERE artist_id = $1`
	args := []interface{}{artistID}

	if status != "" {
		query += " AND status = $2"
		args = append(args, status)
	}

	query += " ORDER BY created_at DESC LIMIT $" + fmt.Sprintf("%d", len(args)+1) + " OFFSET $" + fmt.Sprintf("%d", len(args)+2)
	args = append(args, limit, offset)

	var artworks []DashboardArtwork
	if err := r.db.SelectContext(ctx, &artworks, query, args...); err != nil {
		return nil, fmt.Errorf("listing dashboard artworks: %w", err)
	}
	return artworks, nil
}

func (r *DashboardRepo) GetViewsAnalytics(ctx context.Context, artistID uuid.UUID, period string) ([]DataPoint, error) {
	var query string

	switch period {
	case "week":
		query = `
			SELECT to_char(date, 'Dy') AS label, COALESCE(SUM(views), 0) AS value
			FROM generate_series(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, '1 day') AS date
			LEFT JOIN daily_artwork_stats das ON das.date = date.date
			  AND das.artwork_id IN (SELECT id FROM artworks WHERE artist_id = $1)
			GROUP BY date ORDER BY date`
	case "year":
		query = `
			SELECT to_char(month, 'Mon') AS label, COALESCE(SUM(das.views), 0) AS value
			FROM generate_series(
				date_trunc('year', CURRENT_DATE),
				date_trunc('year', CURRENT_DATE) + INTERVAL '11 months',
				'1 month'
			) AS month
			LEFT JOIN daily_artwork_stats das ON date_trunc('month', das.date) = month
			  AND das.artwork_id IN (SELECT id FROM artworks WHERE artist_id = $1)
			GROUP BY month ORDER BY month`
	default: // month
		query = `
			SELECT 'Week ' || week_num AS label, COALESCE(SUM(views), 0) AS value
			FROM (
				SELECT generate_series(1, 4) AS week_num
			) weeks
			LEFT JOIN daily_artwork_stats das ON
				EXTRACT(WEEK FROM das.date) - EXTRACT(WEEK FROM date_trunc('month', CURRENT_DATE)) + 1 = weeks.week_num
				AND das.date >= date_trunc('month', CURRENT_DATE)
				AND das.date < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month'
				AND das.artwork_id IN (SELECT id FROM artworks WHERE artist_id = $1)
			GROUP BY week_num ORDER BY week_num`
	}

	var points []DataPoint
	if err := r.db.SelectContext(ctx, &points, query, artistID); err != nil {
		return nil, fmt.Errorf("getting views analytics: %w", err)
	}
	return points, nil
}

func (r *DashboardRepo) GetSalesAnalytics(ctx context.Context, artistID uuid.UUID, period string) ([]DataPoint, error) {
	var query string

	switch period {
	case "week":
		query = `
			SELECT to_char(date, 'Dy') AS label, COALESCE(SUM(das.revenue), 0) AS value
			FROM generate_series(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, '1 day') AS date
			LEFT JOIN daily_artwork_stats das ON das.date = date.date
			  AND das.artwork_id IN (SELECT id FROM artworks WHERE artist_id = $1)
			GROUP BY date ORDER BY date`
	case "year":
		query = `
			SELECT to_char(month, 'Mon') AS label, COALESCE(SUM(das.revenue), 0) AS value
			FROM generate_series(
				date_trunc('year', CURRENT_DATE),
				date_trunc('year', CURRENT_DATE) + INTERVAL '11 months',
				'1 month'
			) AS month
			LEFT JOIN daily_artwork_stats das ON date_trunc('month', das.date) = month
			  AND das.artwork_id IN (SELECT id FROM artworks WHERE artist_id = $1)
			GROUP BY month ORDER BY month`
	default: // month
		query = `
			SELECT 'Week ' || week_num AS label, COALESCE(SUM(revenue), 0) AS value
			FROM (
				SELECT generate_series(1, 4) AS week_num
			) weeks
			LEFT JOIN daily_artwork_stats das ON
				EXTRACT(WEEK FROM das.date) - EXTRACT(WEEK FROM date_trunc('month', CURRENT_DATE)) + 1 = weeks.week_num
				AND das.date >= date_trunc('month', CURRENT_DATE)
				AND das.date < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month'
				AND das.artwork_id IN (SELECT id FROM artworks WHERE artist_id = $1)
			GROUP BY week_num ORDER BY week_num`
	}

	var points []DataPoint
	if err := r.db.SelectContext(ctx, &points, query, artistID); err != nil {
		return nil, fmt.Errorf("getting sales analytics: %w", err)
	}
	return points, nil
}

type DashboardOrder struct {
	ID         uuid.UUID `json:"id" db:"id"`
	BuyerID    uuid.UUID `json:"buyer_id" db:"buyer_id"`
	Status     string    `json:"status" db:"status"`
	TotalCents int64     `json:"total_cents" db:"total_cents"`
	Currency   string    `json:"currency" db:"currency"`
	CreatedAt  time.Time `json:"created_at" db:"created_at"`
	ItemCount  int       `json:"item_count" db:"item_count"`
}

func (r *DashboardRepo) GetSellerOrders(ctx context.Context, sellerID uuid.UUID, limit, offset int) ([]DashboardOrder, error) {
	var orders []DashboardOrder
	err := r.db.SelectContext(ctx, &orders, `
		SELECT DISTINCT o.id, o.buyer_id, o.status, o.total_cents, o.currency, o.created_at,
			(SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) AS item_count
		FROM orders o
		JOIN order_items oi ON oi.order_id = o.id
		WHERE oi.seller_id = $1
		ORDER BY o.created_at DESC
		LIMIT $2 OFFSET $3
	`, sellerID, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("getting seller orders: %w", err)
	}
	return orders, nil
}
