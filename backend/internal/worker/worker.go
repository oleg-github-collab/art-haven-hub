package worker

import (
	"context"
	"log/slog"
	"time"

	"github.com/art-haven-hub/backend/internal/repository"
	"github.com/jmoiron/sqlx"
	"github.com/redis/go-redis/v9"
)

type Manager struct {
	db            *sqlx.DB
	rdb           *redis.Client
	promotionRepo *repository.PromotionRepo
}

func NewManager(db *sqlx.DB, rdb *redis.Client, promotionRepo *repository.PromotionRepo) *Manager {
	return &Manager{
		db:            db,
		rdb:           rdb,
		promotionRepo: promotionRepo,
	}
}

func (m *Manager) Start(ctx context.Context) {
	go m.runTicker(ctx, "promotion_expiry", 5*time.Minute, m.expirePromotions)
	go m.runTicker(ctx, "analytics_aggregator", 1*time.Hour, m.aggregateAnalytics)
	go m.runTicker(ctx, "view_flusher", 30*time.Second, m.flushViewCounts)
	go m.runTicker(ctx, "stale_cleanup", 6*time.Hour, m.cleanupStale)

	slog.Info("background workers started")
}

func (m *Manager) runTicker(ctx context.Context, name string, interval time.Duration, fn func(context.Context)) {
	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			slog.Info("worker stopped", "worker", name)
			return
		case <-ticker.C:
			fn(ctx)
		}
	}
}

func (m *Manager) expirePromotions(ctx context.Context) {
	affected, err := m.promotionRepo.ExpireOverdue(ctx)
	if err != nil {
		slog.Error("expire promotions failed", "error", err)
		return
	}
	if affected > 0 {
		slog.Info("expired promotions", "count", affected)
	}
}

func (m *Manager) aggregateAnalytics(ctx context.Context) {
	today := time.Now().Format("2006-01-02")

	_, err := m.db.ExecContext(ctx, `
		INSERT INTO daily_artwork_stats (artwork_id, date, views, likes, favorites, orders, revenue)
		SELECT
			a.id,
			$1::DATE,
			a.view_count,
			a.like_count,
			(SELECT COUNT(*) FROM artwork_favorites WHERE artwork_id = a.id),
			(SELECT COUNT(*) FROM order_items oi JOIN orders o ON o.id = oi.order_id
			 WHERE oi.artwork_id = a.id AND o.status = 'paid' AND o.created_at::DATE = $1::DATE),
			COALESCE((SELECT SUM(oi.price_cents) FROM order_items oi JOIN orders o ON o.id = oi.order_id
			 WHERE oi.artwork_id = a.id AND o.status = 'paid' AND o.created_at::DATE = $1::DATE), 0)
		FROM artworks a
		ON CONFLICT (artwork_id, date) DO UPDATE SET
			views = EXCLUDED.views,
			likes = EXCLUDED.likes,
			favorites = EXCLUDED.favorites,
			orders = EXCLUDED.orders,
			revenue = EXCLUDED.revenue
	`, today)
	if err != nil {
		slog.Error("analytics aggregation failed", "error", err)
		return
	}

	_, err = m.db.ExecContext(ctx, `
		INSERT INTO daily_artist_stats (artist_id, date, total_views, total_likes, total_favorites, total_orders, total_revenue, follower_count)
		SELECT
			u.id,
			$1::DATE,
			COALESCE(SUM(a.view_count), 0),
			COALESCE(SUM(a.like_count), 0),
			COALESCE((SELECT COUNT(*) FROM artwork_favorites af WHERE af.artwork_id IN (SELECT id FROM artworks WHERE artist_id = u.id)), 0),
			COALESCE((SELECT COUNT(DISTINCT o.id) FROM order_items oi JOIN orders o ON o.id = oi.order_id
			 WHERE oi.seller_id = u.id AND o.status = 'paid' AND o.created_at::DATE = $1::DATE), 0),
			COALESCE((SELECT SUM(oi.price_cents) FROM order_items oi JOIN orders o ON o.id = oi.order_id
			 WHERE oi.seller_id = u.id AND o.status = 'paid' AND o.created_at::DATE = $1::DATE), 0),
			(SELECT COUNT(*) FROM follows WHERE following_id = u.id)
		FROM users u
		LEFT JOIN artworks a ON a.artist_id = u.id
		GROUP BY u.id
		ON CONFLICT (artist_id, date) DO UPDATE SET
			total_views = EXCLUDED.total_views,
			total_likes = EXCLUDED.total_likes,
			total_favorites = EXCLUDED.total_favorites,
			total_orders = EXCLUDED.total_orders,
			total_revenue = EXCLUDED.total_revenue,
			follower_count = EXCLUDED.follower_count
	`, today)
	if err != nil {
		slog.Error("artist analytics aggregation failed", "error", err)
	}
}

func (m *Manager) flushViewCounts(ctx context.Context) {
	// Flush artwork view counts from Redis to PostgreSQL
	keys, err := m.rdb.Keys(ctx, "views:artwork:*").Result()
	if err != nil || len(keys) == 0 {
		return
	}

	for _, key := range keys {
		count, err := m.rdb.GetDel(ctx, key).Int64()
		if err != nil || count == 0 {
			continue
		}

		// Extract artwork ID from key "views:artwork:{uuid}"
		artworkID := key[len("views:artwork:"):]
		_, err = m.db.ExecContext(ctx, `
			UPDATE artworks SET view_count = view_count + $1 WHERE id = $2
		`, count, artworkID)
		if err != nil {
			slog.Error("flush view count failed", "artwork_id", artworkID, "error", err)
		}
	}
}

func (m *Manager) cleanupStale(ctx context.Context) {
	// Expire stale announcements
	result, err := m.db.ExecContext(ctx, `
		UPDATE announcements SET is_active = false
		WHERE is_active = true AND expires_at IS NOT NULL AND expires_at < NOW()
	`)
	if err != nil {
		slog.Error("stale cleanup failed", "error", err)
		return
	}
	if affected, _ := result.RowsAffected(); affected > 0 {
		slog.Info("deactivated stale announcements", "count", affected)
	}

	// Clean up expired refresh tokens
	_, _ = m.db.ExecContext(ctx, `DELETE FROM refresh_tokens WHERE expires_at < NOW()`)
}
