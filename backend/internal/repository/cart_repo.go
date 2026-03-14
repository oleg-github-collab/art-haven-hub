package repository

import (
	"context"

	"github.com/art-haven-hub/backend/internal/model"
	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
)

type CartRepo struct {
	db *sqlx.DB
}

func NewCartRepo(db *sqlx.DB) *CartRepo {
	return &CartRepo{db: db}
}

func (r *CartRepo) GetItems(ctx context.Context, userID uuid.UUID) ([]model.CartItem, error) {
	var items []model.CartItem
	err := r.db.SelectContext(ctx, &items,
		`SELECT * FROM cart_items WHERE user_id = $1 ORDER BY added_at DESC`, userID)
	if items == nil {
		items = []model.CartItem{}
	}
	return items, err
}

func (r *CartRepo) AddItem(ctx context.Context, userID, artworkID uuid.UUID, quantity int) error {
	_, err := r.db.ExecContext(ctx,
		`INSERT INTO cart_items (user_id, artwork_id, quantity)
		 VALUES ($1, $2, $3)
		 ON CONFLICT (user_id, artwork_id) DO UPDATE SET quantity = cart_items.quantity + $3`,
		userID, artworkID, quantity)
	return err
}

func (r *CartRepo) UpdateQuantity(ctx context.Context, userID, artworkID uuid.UUID, quantity int) error {
	_, err := r.db.ExecContext(ctx,
		`UPDATE cart_items SET quantity = $3 WHERE user_id = $1 AND artwork_id = $2`,
		userID, artworkID, quantity)
	return err
}

func (r *CartRepo) RemoveItem(ctx context.Context, userID, artworkID uuid.UUID) error {
	_, err := r.db.ExecContext(ctx,
		`DELETE FROM cart_items WHERE user_id = $1 AND artwork_id = $2`,
		userID, artworkID)
	return err
}

func (r *CartRepo) Clear(ctx context.Context, userID uuid.UUID) error {
	_, err := r.db.ExecContext(ctx,
		`DELETE FROM cart_items WHERE user_id = $1`, userID)
	return err
}

func (r *CartRepo) GetItemCount(ctx context.Context, userID uuid.UUID) (int, error) {
	var count int
	err := r.db.GetContext(ctx, &count,
		`SELECT COALESCE(SUM(quantity), 0) FROM cart_items WHERE user_id = $1`, userID)
	return count, err
}
