package repository

import (
	"context"
	"database/sql"
	"errors"

	"github.com/art-haven-hub/backend/internal/model"
	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
)

type CallRepo struct {
	db *sqlx.DB
}

func NewCallRepo(db *sqlx.DB) *CallRepo {
	return &CallRepo{db: db}
}

func (r *CallRepo) Create(ctx context.Context, c *model.Call) error {
	return r.db.QueryRowxContext(ctx,
		`INSERT INTO calls (conversation_id, caller_id, callee_id, call_type, status)
		 VALUES ($1, $2, $3, $4, $5)
		 RETURNING id, created_at, updated_at`,
		c.ConversationID, c.CallerID, c.CalleeID, c.CallType, c.Status,
	).Scan(&c.ID, &c.CreatedAt, &c.UpdatedAt)
}

func (r *CallRepo) UpdateStatus(ctx context.Context, id uuid.UUID, status string) error {
	_, err := r.db.ExecContext(ctx,
		`UPDATE calls SET status = $2 WHERE id = $1`, id, status)
	return err
}

func (r *CallRepo) SetConnected(ctx context.Context, id uuid.UUID) error {
	_, err := r.db.ExecContext(ctx,
		`UPDATE calls SET status = 'connected', started_at = NOW() WHERE id = $1`, id)
	return err
}

func (r *CallRepo) EndCall(ctx context.Context, id uuid.UUID, reason string) error {
	_, err := r.db.ExecContext(ctx,
		`UPDATE calls SET status = 'ended', ended_at = NOW(),
		 end_reason = $2,
		 duration_secs = COALESCE(EXTRACT(EPOCH FROM (NOW() - started_at))::INTEGER, 0)
		 WHERE id = $1`, id, reason)
	return err
}

func (r *CallRepo) GetByID(ctx context.Context, id uuid.UUID) (*model.Call, error) {
	var c model.Call
	err := r.db.GetContext(ctx, &c, `SELECT * FROM calls WHERE id = $1`, id)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	return &c, err
}

func (r *CallRepo) GetActiveCallForUser(ctx context.Context, userID uuid.UUID) (*model.Call, error) {
	var c model.Call
	err := r.db.GetContext(ctx, &c,
		`SELECT * FROM calls
		 WHERE (caller_id = $1 OR callee_id = $1)
		 AND status IN ('initiating', 'ringing', 'connected')
		 ORDER BY created_at DESC LIMIT 1`, userID)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	return &c, err
}

func (r *CallRepo) GetCallHistory(ctx context.Context, userID uuid.UUID, limit, offset int) ([]model.Call, error) {
	var calls []model.Call
	err := r.db.SelectContext(ctx, &calls,
		`SELECT * FROM calls
		 WHERE caller_id = $1 OR callee_id = $1
		 ORDER BY created_at DESC
		 LIMIT $2 OFFSET $3`, userID, limit, offset)
	if calls == nil {
		calls = []model.Call{}
	}
	return calls, err
}

func (r *CallRepo) GetConversationCalls(ctx context.Context, convID uuid.UUID, limit, offset int) ([]model.Call, error) {
	var calls []model.Call
	err := r.db.SelectContext(ctx, &calls,
		`SELECT * FROM calls
		 WHERE conversation_id = $1
		 ORDER BY created_at DESC
		 LIMIT $2 OFFSET $3`, convID, limit, offset)
	if calls == nil {
		calls = []model.Call{}
	}
	return calls, err
}
