package repository

import (
	"context"
	"database/sql"
	"errors"

	"github.com/art-haven-hub/backend/internal/model"
	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
)

type MessengerRepo struct {
	db *sqlx.DB
}

func NewMessengerRepo(db *sqlx.DB) *MessengerRepo {
	return &MessengerRepo{db: db}
}

func (r *MessengerRepo) CreateConversation(ctx context.Context, c *model.Conversation) error {
	query := `INSERT INTO conversations (type, name, avatar_url, creator_id)
		VALUES ($1, $2, $3, $4) RETURNING id, created_at, updated_at`
	return r.db.QueryRowxContext(ctx, query,
		c.Type, c.Name, c.AvatarURL, c.CreatorID,
	).Scan(&c.ID, &c.CreatedAt, &c.UpdatedAt)
}

func (r *MessengerRepo) AddMember(ctx context.Context, convID, userID uuid.UUID, role string) error {
	_, err := r.db.ExecContext(ctx,
		`INSERT INTO conversation_members (conversation_id, user_id, role)
		 VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
		convID, userID, role)
	return err
}

func (r *MessengerRepo) GetConversation(ctx context.Context, id uuid.UUID) (*model.Conversation, error) {
	var c model.Conversation
	err := r.db.GetContext(ctx, &c, `SELECT * FROM conversations WHERE id = $1`, id)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	return &c, err
}

func (r *MessengerRepo) GetUserConversations(ctx context.Context, userID uuid.UUID) ([]model.Conversation, error) {
	var convs []model.Conversation
	err := r.db.SelectContext(ctx, &convs,
		`SELECT c.* FROM conversations c
		 JOIN conversation_members cm ON cm.conversation_id = c.id
		 WHERE cm.user_id = $1
		 ORDER BY COALESCE(c.last_msg_at, c.created_at) DESC`,
		userID)
	if convs == nil {
		convs = []model.Conversation{}
	}
	return convs, err
}

func (r *MessengerRepo) GetMembers(ctx context.Context, convID uuid.UUID) ([]model.ConversationMember, error) {
	var members []model.ConversationMember
	err := r.db.SelectContext(ctx, &members,
		`SELECT * FROM conversation_members WHERE conversation_id = $1`, convID)
	return members, err
}

func (r *MessengerRepo) IsMember(ctx context.Context, convID, userID uuid.UUID) (bool, error) {
	var exists bool
	err := r.db.GetContext(ctx, &exists,
		`SELECT EXISTS(SELECT 1 FROM conversation_members WHERE conversation_id = $1 AND user_id = $2)`,
		convID, userID)
	return exists, err
}

func (r *MessengerRepo) GetPrivateConversation(ctx context.Context, userA, userB uuid.UUID) (*model.Conversation, error) {
	var c model.Conversation
	err := r.db.GetContext(ctx, &c,
		`SELECT c.* FROM conversations c
		 JOIN conversation_members cm1 ON cm1.conversation_id = c.id AND cm1.user_id = $1
		 JOIN conversation_members cm2 ON cm2.conversation_id = c.id AND cm2.user_id = $2
		 WHERE c.type = 'private'
		 LIMIT 1`,
		userA, userB)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	return &c, err
}

// --- Messages ---

func (r *MessengerRepo) CreateMessage(ctx context.Context, m *model.Message) error {
	query := `INSERT INTO messages (conversation_id, sender_id, content, message_type, attachments, reply_to_id)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, created_at, updated_at`
	err := r.db.QueryRowxContext(ctx, query,
		m.ConversationID, m.SenderID, m.Content, m.MessageType, m.Attachments, m.ReplyToID,
	).Scan(&m.ID, &m.CreatedAt, &m.UpdatedAt)
	if err != nil {
		return err
	}

	// Update conversation last message
	r.db.ExecContext(ctx,
		`UPDATE conversations SET last_message = $2, last_msg_at = $3 WHERE id = $1`,
		m.ConversationID, truncate(m.Content, 100), m.CreatedAt)

	return nil
}

func (r *MessengerRepo) GetMessages(ctx context.Context, convID uuid.UUID, limit, offset int) ([]model.Message, error) {
	var msgs []model.Message
	err := r.db.SelectContext(ctx, &msgs,
		`SELECT * FROM messages WHERE conversation_id = $1
		 ORDER BY created_at DESC
		 LIMIT $2 OFFSET $3`,
		convID, limit, offset)
	if msgs == nil {
		msgs = []model.Message{}
	}
	return msgs, err
}

func (r *MessengerRepo) MarkRead(ctx context.Context, convID, userID uuid.UUID) error {
	_, err := r.db.ExecContext(ctx,
		`UPDATE conversation_members SET last_read_at = NOW()
		 WHERE conversation_id = $1 AND user_id = $2`,
		convID, userID)
	return err
}

func (r *MessengerRepo) UpdatePin(ctx context.Context, convID, userID uuid.UUID, pinned bool) error {
	_, err := r.db.ExecContext(ctx,
		`UPDATE conversation_members SET is_pinned = $3
		 WHERE conversation_id = $1 AND user_id = $2`,
		convID, userID, pinned)
	return err
}

func (r *MessengerRepo) UpdateMute(ctx context.Context, convID, userID uuid.UUID, muted bool) error {
	_, err := r.db.ExecContext(ctx,
		`UPDATE conversation_members SET is_muted = $3
		 WHERE conversation_id = $1 AND user_id = $2`,
		convID, userID, muted)
	return err
}

func (r *MessengerRepo) GetUserByID(ctx context.Context, id uuid.UUID) (*model.User, error) {
	var u model.User
	err := r.db.GetContext(ctx, &u,
		`SELECT id, name, handle, avatar_url, is_verified FROM users WHERE id = $1`, id)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	return &u, err
}

func truncate(s string, maxLen int) string {
	if len(s) <= maxLen {
		return s
	}
	return s[:maxLen] + "..."
}
