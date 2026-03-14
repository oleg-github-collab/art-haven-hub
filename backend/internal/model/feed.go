package model

import (
	"time"

	"github.com/google/uuid"
)

type FeedPost struct {
	ID           uuid.UUID   `db:"id" json:"id"`
	AuthorID     uuid.UUID   `db:"author_id" json:"author_id"`
	Content      string      `db:"content" json:"content"`
	Images       StringArray `db:"images" json:"images"`
	Tags         StringArray `db:"tags" json:"tags"`
	LikeCount    int         `db:"like_count" json:"like_count"`
	CommentCount int         `db:"comment_count" json:"comment_count"`
	RepostCount  int         `db:"repost_count" json:"repost_count"`
	CreatedAt    time.Time   `db:"created_at" json:"created_at"`
	UpdatedAt    time.Time   `db:"updated_at" json:"updated_at"`

	// Computed
	Author      *User `db:"-" json:"author,omitempty"`
	IsLiked     bool  `db:"-" json:"is_liked"`
	IsReposted  bool  `db:"-" json:"is_reposted"`
	IsBookmarked bool `db:"-" json:"is_bookmarked"`
}

type FeedComment struct {
	ID        uuid.UUID `db:"id" json:"id"`
	PostID    uuid.UUID `db:"post_id" json:"post_id"`
	AuthorID  uuid.UUID `db:"author_id" json:"author_id"`
	Content   string    `db:"content" json:"content"`
	LikeCount int       `db:"like_count" json:"like_count"`
	CreatedAt time.Time `db:"created_at" json:"created_at"`
	UpdatedAt time.Time `db:"updated_at" json:"updated_at"`

	// Computed
	Author  *User `db:"-" json:"author,omitempty"`
	IsLiked bool  `db:"-" json:"is_liked"`
}
