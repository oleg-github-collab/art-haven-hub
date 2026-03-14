package repository

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/art-haven-hub/backend/internal/model"
	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
)

type SubscriptionRepo struct {
	db *sqlx.DB
}

func NewSubscriptionRepo(db *sqlx.DB) *SubscriptionRepo {
	return &SubscriptionRepo{db: db}
}

func (r *SubscriptionRepo) GetByUserID(ctx context.Context, userID uuid.UUID) (*model.Subscription, error) {
	var sub model.Subscription
	err := r.db.GetContext(ctx, &sub, `
		SELECT * FROM subscriptions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1
	`, userID)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("getting subscription: %w", err)
	}
	return &sub, nil
}

func (r *SubscriptionRepo) Create(ctx context.Context, sub *model.Subscription) error {
	sub.ID = uuid.New()
	_, err := r.db.NamedExecContext(ctx, `
		INSERT INTO subscriptions (id, user_id, plan, stripe_customer_id, stripe_subscription_id, status, current_period_end)
		VALUES (:id, :user_id, :plan, :stripe_customer_id, :stripe_subscription_id, :status, :current_period_end)
	`, sub)
	if err != nil {
		return fmt.Errorf("creating subscription: %w", err)
	}
	return nil
}

func (r *SubscriptionRepo) Update(ctx context.Context, sub *model.Subscription) error {
	_, err := r.db.NamedExecContext(ctx, `
		UPDATE subscriptions
		SET plan = :plan,
		    stripe_subscription_id = :stripe_subscription_id,
		    status = :status,
		    current_period_end = :current_period_end,
		    updated_at = NOW()
		WHERE id = :id
	`, sub)
	if err != nil {
		return fmt.Errorf("updating subscription: %w", err)
	}
	return nil
}

func (r *SubscriptionRepo) GetByStripeCustomer(ctx context.Context, customerID string) (*model.Subscription, error) {
	var sub model.Subscription
	err := r.db.GetContext(ctx, &sub, `
		SELECT * FROM subscriptions WHERE stripe_customer_id = $1 ORDER BY created_at DESC LIMIT 1
	`, customerID)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &sub, nil
}
