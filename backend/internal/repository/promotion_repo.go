package repository

import (
	"context"
	"fmt"

	"github.com/art-haven-hub/backend/internal/model"
	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
)

type PromotionRepo struct {
	db *sqlx.DB
}

func NewPromotionRepo(db *sqlx.DB) *PromotionRepo {
	return &PromotionRepo{db: db}
}

func (r *PromotionRepo) Create(ctx context.Context, p *model.Promotion) error {
	p.ID = uuid.New()
	_, err := r.db.NamedExecContext(ctx, `
		INSERT INTO promotions (id, artwork_id, user_id, duration_days, price_cents, currency, stripe_session_id, status)
		VALUES (:id, :artwork_id, :user_id, :duration_days, :price_cents, :currency, :stripe_session_id, :status)
	`, p)
	if err != nil {
		return fmt.Errorf("creating promotion: %w", err)
	}
	return nil
}

func (r *PromotionRepo) GetByStripeSession(ctx context.Context, sessionID string) (*model.Promotion, error) {
	var p model.Promotion
	err := r.db.GetContext(ctx, &p, `SELECT * FROM promotions WHERE stripe_session_id = $1`, sessionID)
	if err != nil {
		return nil, err
	}
	return &p, nil
}

func (r *PromotionRepo) Activate(ctx context.Context, id uuid.UUID) error {
	_, err := r.db.ExecContext(ctx, `
		UPDATE promotions
		SET status = 'active',
		    starts_at = NOW(),
		    ends_at = NOW() + (duration_days || ' days')::INTERVAL
		WHERE id = $1
	`, id)
	if err != nil {
		return fmt.Errorf("activating promotion: %w", err)
	}

	// Also mark the artwork as promoted
	_, err = r.db.ExecContext(ctx, `
		UPDATE artworks
		SET is_promoted = true,
		    promoted_until = (SELECT ends_at FROM promotions WHERE id = $1),
		    status = 'promoted'
		WHERE id = (SELECT artwork_id FROM promotions WHERE id = $1)
	`, id)
	return err
}

func (r *PromotionRepo) ExpireOverdue(ctx context.Context) (int64, error) {
	result, err := r.db.ExecContext(ctx, `
		UPDATE artworks
		SET is_promoted = false,
		    promoted_until = NULL,
		    status = 'active'
		WHERE is_promoted = true AND promoted_until < NOW()
	`)
	if err != nil {
		return 0, err
	}

	affected, _ := result.RowsAffected()

	_, _ = r.db.ExecContext(ctx, `
		UPDATE promotions SET status = 'expired'
		WHERE status = 'active' AND ends_at < NOW()
	`)

	return affected, nil
}
