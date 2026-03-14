package model

import (
	"time"

	"github.com/google/uuid"
)

type User struct {
	ID            uuid.UUID  `db:"id" json:"id"`
	Email         string     `db:"email" json:"email"`
	PasswordHash  *string    `db:"password_hash" json:"-"`
	Name          string     `db:"name" json:"name"`
	Handle        string     `db:"handle" json:"handle"`
	AvatarURL     *string    `db:"avatar_url" json:"avatar_url,omitempty"`
	CoverColor    string     `db:"cover_color" json:"cover_color"`
	Bio           *string    `db:"bio" json:"bio,omitempty"`
	Location      *string    `db:"location" json:"location,omitempty"`
	Website       *string    `db:"website" json:"website,omitempty"`
	Tags          StringArray `db:"tags" json:"tags"`
	IsVerified    bool       `db:"is_verified" json:"is_verified"`
	PreferredLang string     `db:"preferred_lang" json:"preferred_lang"`
	CreatedAt     time.Time  `db:"created_at" json:"created_at"`
	UpdatedAt     time.Time  `db:"updated_at" json:"updated_at"`

	// Computed fields (not in DB directly)
	Roles         []string `db:"-" json:"roles,omitempty"`
	FollowerCount int      `db:"-" json:"follower_count,omitempty"`
	FollowingCount int     `db:"-" json:"following_count,omitempty"`
	IsFollowing   bool     `db:"-" json:"is_following,omitempty"`
}

type UserRole struct {
	ID     uuid.UUID `db:"id"`
	UserID uuid.UUID `db:"user_id"`
	Role   string    `db:"role"`
}

type OAuthAccount struct {
	ID           uuid.UUID `db:"id"`
	UserID       uuid.UUID `db:"user_id"`
	Provider     string    `db:"provider"`
	ProviderID   string    `db:"provider_id"`
	AccessToken  *string   `db:"access_token"`
	RefreshToken *string   `db:"refresh_token"`
	CreatedAt    time.Time `db:"created_at"`
}

type RefreshToken struct {
	ID        uuid.UUID `db:"id"`
	UserID    uuid.UUID `db:"user_id"`
	TokenHash string    `db:"token_hash"`
	ExpiresAt time.Time `db:"expires_at"`
	CreatedAt time.Time `db:"created_at"`
	Revoked   bool      `db:"revoked"`
}

type Follow struct {
	ID         uuid.UUID `db:"id"`
	FollowerID uuid.UUID `db:"follower_id"`
	FollowedID uuid.UUID `db:"followed_id"`
	CreatedAt  time.Time `db:"created_at"`
}
