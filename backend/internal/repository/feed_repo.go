package repository

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

	"github.com/art-haven-hub/backend/internal/model"
	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
)

type FeedRepo struct {
	db *sqlx.DB
}

func NewFeedRepo(db *sqlx.DB) *FeedRepo {
	return &FeedRepo{db: db}
}

func (r *FeedRepo) CreatePost(ctx context.Context, p *model.FeedPost) error {
	query := `INSERT INTO feed_posts (author_id, content, images, tags)
		VALUES ($1, $2, $3, $4) RETURNING id, created_at, updated_at`
	return r.db.QueryRowxContext(ctx, query,
		p.AuthorID, p.Content, p.Images, p.Tags,
	).Scan(&p.ID, &p.CreatedAt, &p.UpdatedAt)
}

func (r *FeedRepo) GetPostByID(ctx context.Context, id uuid.UUID) (*model.FeedPost, error) {
	var p model.FeedPost
	err := r.db.GetContext(ctx, &p, `SELECT * FROM feed_posts WHERE id = $1`, id)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	return &p, err
}

func (r *FeedRepo) UpdatePost(ctx context.Context, id uuid.UUID, content string, images model.StringArray, tags model.StringArray) error {
	_, err := r.db.ExecContext(ctx,
		`UPDATE feed_posts SET content = $2, images = $3, tags = $4 WHERE id = $1`,
		id, content, images, tags)
	return err
}

func (r *FeedRepo) DeletePost(ctx context.Context, id uuid.UUID) error {
	_, err := r.db.ExecContext(ctx, `DELETE FROM feed_posts WHERE id = $1`, id)
	return err
}

func (r *FeedRepo) ListPosts(ctx context.Context, sort string, limit, offset int) ([]model.FeedPost, error) {
	orderBy := "ORDER BY created_at DESC"
	if sort == "hot" {
		orderBy = "ORDER BY (like_count + repost_count) DESC, created_at DESC"
	}
	query := fmt.Sprintf(`SELECT * FROM feed_posts %s LIMIT $1 OFFSET $2`, orderBy)
	var posts []model.FeedPost
	err := r.db.SelectContext(ctx, &posts, query, limit, offset)
	if posts == nil {
		posts = []model.FeedPost{}
	}
	return posts, err
}

func (r *FeedRepo) ListFollowingPosts(ctx context.Context, userID uuid.UUID, limit, offset int) ([]model.FeedPost, error) {
	var posts []model.FeedPost
	err := r.db.SelectContext(ctx, &posts,
		`SELECT fp.* FROM feed_posts fp
		 JOIN follows f ON f.followed_id = fp.author_id
		 WHERE f.follower_id = $1
		 ORDER BY fp.created_at DESC
		 LIMIT $2 OFFSET $3`,
		userID, limit, offset)
	if posts == nil {
		posts = []model.FeedPost{}
	}
	return posts, err
}

// --- Comments ---

func (r *FeedRepo) CreateComment(ctx context.Context, c *model.FeedComment) error {
	err := r.db.QueryRowxContext(ctx,
		`INSERT INTO feed_comments (post_id, author_id, content) VALUES ($1, $2, $3) RETURNING id, created_at, updated_at`,
		c.PostID, c.AuthorID, c.Content,
	).Scan(&c.ID, &c.CreatedAt, &c.UpdatedAt)
	if err == nil {
		r.db.ExecContext(ctx, `UPDATE feed_posts SET comment_count = comment_count + 1 WHERE id = $1`, c.PostID)
	}
	return err
}

func (r *FeedRepo) DeleteComment(ctx context.Context, commentID, postID uuid.UUID) error {
	result, err := r.db.ExecContext(ctx, `DELETE FROM feed_comments WHERE id = $1`, commentID)
	if err != nil {
		return err
	}
	if rows, _ := result.RowsAffected(); rows > 0 {
		r.db.ExecContext(ctx, `UPDATE feed_posts SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = $1`, postID)
	}
	return nil
}

func (r *FeedRepo) GetComments(ctx context.Context, postID uuid.UUID, limit, offset int) ([]model.FeedComment, error) {
	var comments []model.FeedComment
	err := r.db.SelectContext(ctx, &comments,
		`SELECT * FROM feed_comments WHERE post_id = $1 ORDER BY created_at LIMIT $2 OFFSET $3`,
		postID, limit, offset)
	if comments == nil {
		comments = []model.FeedComment{}
	}
	return comments, err
}

func (r *FeedRepo) GetCommentByID(ctx context.Context, id uuid.UUID) (*model.FeedComment, error) {
	var c model.FeedComment
	err := r.db.GetContext(ctx, &c, `SELECT * FROM feed_comments WHERE id = $1`, id)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	return &c, err
}

// --- Likes ---

func (r *FeedRepo) LikePost(ctx context.Context, userID, postID uuid.UUID) error {
	_, err := r.db.ExecContext(ctx,
		`INSERT INTO feed_likes (user_id, post_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
		userID, postID)
	if err == nil {
		r.db.ExecContext(ctx, `UPDATE feed_posts SET like_count = like_count + 1 WHERE id = $1`, postID)
	}
	return err
}

func (r *FeedRepo) UnlikePost(ctx context.Context, userID, postID uuid.UUID) error {
	result, err := r.db.ExecContext(ctx,
		`DELETE FROM feed_likes WHERE user_id = $1 AND post_id = $2`, userID, postID)
	if err != nil {
		return err
	}
	if rows, _ := result.RowsAffected(); rows > 0 {
		r.db.ExecContext(ctx, `UPDATE feed_posts SET like_count = GREATEST(like_count - 1, 0) WHERE id = $1`, postID)
	}
	return nil
}

func (r *FeedRepo) IsPostLiked(ctx context.Context, userID, postID uuid.UUID) (bool, error) {
	var exists bool
	err := r.db.GetContext(ctx, &exists,
		`SELECT EXISTS(SELECT 1 FROM feed_likes WHERE user_id = $1 AND post_id = $2)`, userID, postID)
	return exists, err
}

// --- Reposts ---

func (r *FeedRepo) RepostPost(ctx context.Context, userID, postID uuid.UUID) error {
	_, err := r.db.ExecContext(ctx,
		`INSERT INTO feed_reposts (user_id, post_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
		userID, postID)
	if err == nil {
		r.db.ExecContext(ctx, `UPDATE feed_posts SET repost_count = repost_count + 1 WHERE id = $1`, postID)
	}
	return err
}

func (r *FeedRepo) UnrepostPost(ctx context.Context, userID, postID uuid.UUID) error {
	result, err := r.db.ExecContext(ctx,
		`DELETE FROM feed_reposts WHERE user_id = $1 AND post_id = $2`, userID, postID)
	if err != nil {
		return err
	}
	if rows, _ := result.RowsAffected(); rows > 0 {
		r.db.ExecContext(ctx, `UPDATE feed_posts SET repost_count = GREATEST(repost_count - 1, 0) WHERE id = $1`, postID)
	}
	return nil
}

func (r *FeedRepo) IsPostReposted(ctx context.Context, userID, postID uuid.UUID) (bool, error) {
	var exists bool
	err := r.db.GetContext(ctx, &exists,
		`SELECT EXISTS(SELECT 1 FROM feed_reposts WHERE user_id = $1 AND post_id = $2)`, userID, postID)
	return exists, err
}

// --- Bookmarks ---

func (r *FeedRepo) BookmarkPost(ctx context.Context, userID, postID uuid.UUID) error {
	_, err := r.db.ExecContext(ctx,
		`INSERT INTO feed_bookmarks (user_id, post_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
		userID, postID)
	return err
}

func (r *FeedRepo) UnbookmarkPost(ctx context.Context, userID, postID uuid.UUID) error {
	_, err := r.db.ExecContext(ctx,
		`DELETE FROM feed_bookmarks WHERE user_id = $1 AND post_id = $2`, userID, postID)
	return err
}

func (r *FeedRepo) IsPostBookmarked(ctx context.Context, userID, postID uuid.UUID) (bool, error) {
	var exists bool
	err := r.db.GetContext(ctx, &exists,
		`SELECT EXISTS(SELECT 1 FROM feed_bookmarks WHERE user_id = $1 AND post_id = $2)`, userID, postID)
	return exists, err
}

func (r *FeedRepo) GetBookmarks(ctx context.Context, userID uuid.UUID, limit, offset int) ([]model.FeedPost, error) {
	var posts []model.FeedPost
	err := r.db.SelectContext(ctx, &posts,
		`SELECT fp.* FROM feed_posts fp
		 JOIN feed_bookmarks fb ON fb.post_id = fp.id
		 WHERE fb.user_id = $1
		 ORDER BY fb.created_at DESC
		 LIMIT $2 OFFSET $3`,
		userID, limit, offset)
	if posts == nil {
		posts = []model.FeedPost{}
	}
	return posts, err
}

// --- Comment Likes ---

func (r *FeedRepo) LikeComment(ctx context.Context, userID, commentID uuid.UUID) error {
	_, err := r.db.ExecContext(ctx,
		`INSERT INTO feed_comment_likes (user_id, comment_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
		userID, commentID)
	if err == nil {
		r.db.ExecContext(ctx, `UPDATE feed_comments SET like_count = like_count + 1 WHERE id = $1`, commentID)
	}
	return err
}

// --- Author lookup ---

func (r *FeedRepo) GetAuthor(ctx context.Context, id uuid.UUID) (*model.User, error) {
	var u model.User
	err := r.db.GetContext(ctx, &u,
		`SELECT id, name, handle, avatar_url, is_verified FROM users WHERE id = $1`, id)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	return &u, err
}
