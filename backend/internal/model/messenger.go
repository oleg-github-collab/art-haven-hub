package model

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

type Conversation struct {
	ID          uuid.UUID  `db:"id" json:"id"`
	Type        string     `db:"type" json:"type"`
	Name        *string    `db:"name" json:"name,omitempty"`
	AvatarURL   *string    `db:"avatar_url" json:"avatar_url,omitempty"`
	CreatorID   *uuid.UUID `db:"creator_id" json:"creator_id,omitempty"`
	LastMessage *string    `db:"last_message" json:"last_message,omitempty"`
	LastMsgAt   *time.Time `db:"last_msg_at" json:"last_msg_at,omitempty"`
	CreatedAt   time.Time  `db:"created_at" json:"created_at"`
	UpdatedAt   time.Time  `db:"updated_at" json:"updated_at"`

	// Computed
	Members     []ConversationMember `db:"-" json:"members,omitempty"`
	UnreadCount int                  `db:"-" json:"unread_count,omitempty"`
}

type ConversationMember struct {
	ID             uuid.UUID `db:"id" json:"id"`
	ConversationID uuid.UUID `db:"conversation_id" json:"conversation_id"`
	UserID         uuid.UUID `db:"user_id" json:"user_id"`
	Role           string    `db:"role" json:"role"`
	IsMuted        bool      `db:"is_muted" json:"is_muted"`
	IsPinned       bool      `db:"is_pinned" json:"is_pinned"`
	LastReadAt     time.Time `db:"last_read_at" json:"last_read_at"`
	JoinedAt       time.Time `db:"joined_at" json:"joined_at"`

	// Computed
	User *User `db:"-" json:"user,omitempty"`
}

type Message struct {
	ID             uuid.UUID       `db:"id" json:"id"`
	ConversationID uuid.UUID       `db:"conversation_id" json:"conversation_id"`
	SenderID       uuid.UUID       `db:"sender_id" json:"sender_id"`
	Content        string          `db:"content" json:"content"`
	MessageType    string          `db:"message_type" json:"message_type"`
	Attachments    json.RawMessage `db:"attachments" json:"attachments"`
	ReplyToID      *uuid.UUID      `db:"reply_to_id" json:"reply_to_id,omitempty"`
	ForwardedFrom  *uuid.UUID      `db:"forwarded_from" json:"forwarded_from,omitempty"`
	IsEdited       bool            `db:"is_edited" json:"is_edited"`
	IsDeleted      bool            `db:"is_deleted" json:"is_deleted"`
	CreatedAt      time.Time       `db:"created_at" json:"created_at"`
	UpdatedAt      time.Time       `db:"updated_at" json:"updated_at"`

	// Computed
	Sender    *User              `db:"-" json:"sender,omitempty"`
	ReplyTo   *Message           `db:"-" json:"reply_to,omitempty"`
	Reactions []MessageReaction  `db:"-" json:"reactions,omitempty"`
}

type MessageReaction struct {
	ID        uuid.UUID `db:"id" json:"id"`
	MessageID uuid.UUID `db:"message_id" json:"message_id"`
	UserID    uuid.UUID `db:"user_id" json:"user_id"`
	Emoji     string    `db:"emoji" json:"emoji"`
	CreatedAt time.Time `db:"created_at" json:"created_at"`

	// Computed
	User *User `db:"-" json:"user,omitempty"`
}

type MessageForward struct {
	ID                uuid.UUID `db:"id" json:"id"`
	OriginalMessageID uuid.UUID `db:"original_message_id" json:"original_message_id"`
	ForwardedToConv   uuid.UUID `db:"forwarded_to_conv" json:"forwarded_to_conv"`
	ForwardedBy       uuid.UUID `db:"forwarded_by" json:"forwarded_by"`
	CreatedAt         time.Time `db:"created_at" json:"created_at"`
}
