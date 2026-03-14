package repository

import (
	"context"
	"database/sql"
	"errors"

	"github.com/art-haven-hub/backend/internal/model"
	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
)

type OrderRepo struct {
	db *sqlx.DB
}

func NewOrderRepo(db *sqlx.DB) *OrderRepo {
	return &OrderRepo{db: db}
}

func (r *OrderRepo) Create(ctx context.Context, o *model.Order) error {
	query := `
		INSERT INTO orders (
			buyer_id, status, total_cents, commission_cents, currency,
			stripe_session_id, shipping_name, shipping_email, shipping_phone,
			shipping_address, shipping_method, notes
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
		RETURNING id, created_at, updated_at`

	return r.db.QueryRowxContext(ctx, query,
		o.BuyerID, o.Status, o.TotalCents, o.CommissionCents, o.Currency,
		o.StripeSessionID, o.ShippingName, o.ShippingEmail, o.ShippingPhone,
		o.ShippingAddress, o.ShippingMethod, o.Notes,
	).Scan(&o.ID, &o.CreatedAt, &o.UpdatedAt)
}

func (r *OrderRepo) CreateItem(ctx context.Context, item *model.OrderItem) error {
	query := `
		INSERT INTO order_items (order_id, artwork_id, seller_id, quantity, price_cents, commission_cents, currency)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id`
	return r.db.QueryRowxContext(ctx, query,
		item.OrderID, item.ArtworkID, item.SellerID, item.Quantity,
		item.PriceCents, item.CommissionCents, item.Currency,
	).Scan(&item.ID)
}

func (r *OrderRepo) GetByID(ctx context.Context, id uuid.UUID) (*model.Order, error) {
	var o model.Order
	err := r.db.GetContext(ctx, &o, `SELECT * FROM orders WHERE id = $1`, id)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	var items []model.OrderItem
	if err := r.db.SelectContext(ctx, &items,
		`SELECT * FROM order_items WHERE order_id = $1`, id); err != nil {
		return nil, err
	}
	o.Items = items

	return &o, nil
}

func (r *OrderRepo) GetByStripeSession(ctx context.Context, sessionID string) (*model.Order, error) {
	var o model.Order
	err := r.db.GetContext(ctx, &o,
		`SELECT * FROM orders WHERE stripe_session_id = $1`, sessionID)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	return &o, err
}

func (r *OrderRepo) UpdateStatus(ctx context.Context, id uuid.UUID, status string) error {
	_, err := r.db.ExecContext(ctx,
		`UPDATE orders SET status = $2 WHERE id = $1`, id, status)
	return err
}

func (r *OrderRepo) MarkPaid(ctx context.Context, id uuid.UUID, paymentID string) error {
	_, err := r.db.ExecContext(ctx,
		`UPDATE orders SET status = 'paid', stripe_payment_id = $2, paid_at = NOW() WHERE id = $1`,
		id, paymentID)
	return err
}

func (r *OrderRepo) UpdateStripeSession(ctx context.Context, id uuid.UUID, sessionID string) error {
	_, err := r.db.ExecContext(ctx,
		`UPDATE orders SET stripe_session_id = $2 WHERE id = $1`, id, sessionID)
	return err
}

func (r *OrderRepo) GetOrderItems(ctx context.Context, orderID uuid.UUID) ([]model.OrderItem, error) {
	var items []model.OrderItem
	err := r.db.SelectContext(ctx, &items,
		`SELECT * FROM order_items WHERE order_id = $1`, orderID)
	return items, err
}

func (r *OrderRepo) GetBuyerOrders(ctx context.Context, buyerID uuid.UUID, limit, offset int) ([]model.Order, error) {
	var orders []model.Order
	err := r.db.SelectContext(ctx, &orders,
		`SELECT * FROM orders WHERE buyer_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
		buyerID, limit, offset)
	return orders, err
}

func (r *OrderRepo) GetSellerOrders(ctx context.Context, sellerID uuid.UUID, limit, offset int) ([]model.Order, error) {
	var orders []model.Order
	err := r.db.SelectContext(ctx, &orders,
		`SELECT DISTINCT o.* FROM orders o
		 JOIN order_items oi ON oi.order_id = o.id
		 WHERE oi.seller_id = $1
		 ORDER BY o.created_at DESC
		 LIMIT $2 OFFSET $3`,
		sellerID, limit, offset)
	return orders, err
}
