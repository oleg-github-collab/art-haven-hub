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

type UserRepo struct {
	db *sqlx.DB
}

func NewUserRepo(db *sqlx.DB) *UserRepo {
	return &UserRepo{db: db}
}

func (r *UserRepo) Create(ctx context.Context, u *model.User) error {
	query := `
		INSERT INTO users (email, password_hash, name, handle, avatar_url, bio, location, website, tags, preferred_lang)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		RETURNING id, created_at, updated_at`

	return r.db.QueryRowxContext(ctx, query,
		u.Email, u.PasswordHash, u.Name, u.Handle,
		u.AvatarURL, u.Bio, u.Location, u.Website,
		u.Tags, u.PreferredLang,
	).Scan(&u.ID, &u.CreatedAt, &u.UpdatedAt)
}

func (r *UserRepo) GetByID(ctx context.Context, id uuid.UUID) (*model.User, error) {
	var u model.User
	err := r.db.GetContext(ctx, &u, `SELECT * FROM users WHERE id = $1`, id)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	return &u, err
}

func (r *UserRepo) GetByEmail(ctx context.Context, email string) (*model.User, error) {
	var u model.User
	err := r.db.GetContext(ctx, &u, `SELECT * FROM users WHERE email = $1`, email)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	return &u, err
}

func (r *UserRepo) GetByHandle(ctx context.Context, handle string) (*model.User, error) {
	var u model.User
	err := r.db.GetContext(ctx, &u, `SELECT * FROM users WHERE handle = $1`, handle)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	return &u, err
}

func (r *UserRepo) Update(ctx context.Context, u *model.User) error {
	query := `
		UPDATE users SET
			name = $2, handle = $3, avatar_url = $4, cover_color = $5,
			bio = $6, location = $7, website = $8, tags = $9, preferred_lang = $10
		WHERE id = $1`

	result, err := r.db.ExecContext(ctx, query,
		u.ID, u.Name, u.Handle, u.AvatarURL, u.CoverColor,
		u.Bio, u.Location, u.Website, u.Tags, u.PreferredLang,
	)
	if err != nil {
		return err
	}

	rows, _ := result.RowsAffected()
	if rows == 0 {
		return fmt.Errorf("user not found")
	}
	return nil
}

func (r *UserRepo) UpdateAvatar(ctx context.Context, userID uuid.UUID, avatarURL string) error {
	_, err := r.db.ExecContext(ctx,
		`UPDATE users SET avatar_url = $2 WHERE id = $1`,
		userID, avatarURL,
	)
	return err
}

func (r *UserRepo) UpdatePassword(ctx context.Context, userID uuid.UUID, hash string) error {
	_, err := r.db.ExecContext(ctx,
		`UPDATE users SET password_hash = $2 WHERE id = $1`,
		userID, hash,
	)
	return err
}

func (r *UserRepo) EmailExists(ctx context.Context, email string) (bool, error) {
	var exists bool
	err := r.db.GetContext(ctx, &exists,
		`SELECT EXISTS(SELECT 1 FROM users WHERE email = $1)`, email)
	return exists, err
}

func (r *UserRepo) HandleExists(ctx context.Context, handle string) (bool, error) {
	var exists bool
	err := r.db.GetContext(ctx, &exists,
		`SELECT EXISTS(SELECT 1 FROM users WHERE handle = $1)`, handle)
	return exists, err
}

// --- Roles ---

func (r *UserRepo) GetRoles(ctx context.Context, userID uuid.UUID) ([]string, error) {
	var roles []string
	err := r.db.SelectContext(ctx, &roles,
		`SELECT role FROM user_roles WHERE user_id = $1`, userID)
	if err != nil {
		return nil, err
	}
	if roles == nil {
		roles = []string{"user"}
	}
	return roles, nil
}

func (r *UserRepo) AddRole(ctx context.Context, userID uuid.UUID, role string) error {
	_, err := r.db.ExecContext(ctx,
		`INSERT INTO user_roles (user_id, role) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
		userID, role)
	return err
}

// --- Refresh Tokens ---

func (r *UserRepo) SaveRefreshToken(ctx context.Context, rt *model.RefreshToken) error {
	_, err := r.db.ExecContext(ctx,
		`INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
		rt.UserID, rt.TokenHash, rt.ExpiresAt)
	return err
}

func (r *UserRepo) GetRefreshToken(ctx context.Context, tokenHash string) (*model.RefreshToken, error) {
	var rt model.RefreshToken
	err := r.db.GetContext(ctx, &rt,
		`SELECT * FROM refresh_tokens WHERE token_hash = $1 AND revoked = FALSE AND expires_at > NOW()`,
		tokenHash)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	return &rt, err
}

func (r *UserRepo) RevokeRefreshToken(ctx context.Context, tokenHash string) error {
	_, err := r.db.ExecContext(ctx,
		`UPDATE refresh_tokens SET revoked = TRUE WHERE token_hash = $1`, tokenHash)
	return err
}

func (r *UserRepo) RevokeAllRefreshTokens(ctx context.Context, userID uuid.UUID) error {
	_, err := r.db.ExecContext(ctx,
		`UPDATE refresh_tokens SET revoked = TRUE WHERE user_id = $1 AND revoked = FALSE`, userID)
	return err
}

// --- OAuth ---

func (r *UserRepo) GetOAuthAccount(ctx context.Context, provider, providerID string) (*model.OAuthAccount, error) {
	var oa model.OAuthAccount
	err := r.db.GetContext(ctx, &oa,
		`SELECT * FROM oauth_accounts WHERE provider = $1 AND provider_id = $2`,
		provider, providerID)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	return &oa, err
}

func (r *UserRepo) CreateOAuthAccount(ctx context.Context, oa *model.OAuthAccount) error {
	_, err := r.db.ExecContext(ctx,
		`INSERT INTO oauth_accounts (user_id, provider, provider_id, access_token, refresh_token)
		 VALUES ($1, $2, $3, $4, $5)`,
		oa.UserID, oa.Provider, oa.ProviderID, oa.AccessToken, oa.RefreshToken)
	return err
}

// --- Follows ---

func (r *UserRepo) Follow(ctx context.Context, followerID, followedID uuid.UUID) error {
	_, err := r.db.ExecContext(ctx,
		`INSERT INTO follows (follower_id, followed_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
		followerID, followedID)
	return err
}

func (r *UserRepo) Unfollow(ctx context.Context, followerID, followedID uuid.UUID) error {
	_, err := r.db.ExecContext(ctx,
		`DELETE FROM follows WHERE follower_id = $1 AND followed_id = $2`,
		followerID, followedID)
	return err
}

func (r *UserRepo) IsFollowing(ctx context.Context, followerID, followedID uuid.UUID) (bool, error) {
	var exists bool
	err := r.db.GetContext(ctx, &exists,
		`SELECT EXISTS(SELECT 1 FROM follows WHERE follower_id = $1 AND followed_id = $2)`,
		followerID, followedID)
	return exists, err
}

func (r *UserRepo) GetFollowerCount(ctx context.Context, userID uuid.UUID) (int, error) {
	var count int
	err := r.db.GetContext(ctx, &count,
		`SELECT COUNT(*) FROM follows WHERE followed_id = $1`, userID)
	return count, err
}

func (r *UserRepo) GetFollowingCount(ctx context.Context, userID uuid.UUID) (int, error) {
	var count int
	err := r.db.GetContext(ctx, &count,
		`SELECT COUNT(*) FROM follows WHERE follower_id = $1`, userID)
	return count, err
}

func (r *UserRepo) GetFollowers(ctx context.Context, userID uuid.UUID, limit, offset int) ([]model.User, error) {
	var users []model.User
	err := r.db.SelectContext(ctx, &users,
		`SELECT u.* FROM users u
		 JOIN follows f ON f.follower_id = u.id
		 WHERE f.followed_id = $1
		 ORDER BY f.created_at DESC
		 LIMIT $2 OFFSET $3`,
		userID, limit, offset)
	return users, err
}

func (r *UserRepo) GetFollowing(ctx context.Context, userID uuid.UUID, limit, offset int) ([]model.User, error) {
	var users []model.User
	err := r.db.SelectContext(ctx, &users,
		`SELECT u.* FROM users u
		 JOIN follows f ON f.followed_id = u.id
		 WHERE f.follower_id = $1
		 ORDER BY f.created_at DESC
		 LIMIT $2 OFFSET $3`,
		userID, limit, offset)
	return users, err
}

// --- Artists listing ---

func (r *UserRepo) ListArtists(ctx context.Context, search, city, tag string, limit, offset int) ([]model.User, error) {
	query := `SELECT u.* FROM users u WHERE 1=1`
	args := []interface{}{}
	idx := 1

	if search != "" {
		query += fmt.Sprintf(` AND (u.name ILIKE $%d OR u.handle ILIKE $%d OR u.bio ILIKE $%d)`, idx, idx, idx)
		args = append(args, "%"+search+"%")
		idx++
	}
	if city != "" {
		query += fmt.Sprintf(` AND u.location ILIKE $%d`, idx)
		args = append(args, "%"+city+"%")
		idx++
	}
	if tag != "" {
		query += fmt.Sprintf(` AND $%d = ANY(u.tags)`, idx)
		args = append(args, tag)
		idx++
	}

	query += fmt.Sprintf(` ORDER BY u.created_at DESC LIMIT $%d OFFSET $%d`, idx, idx+1)
	args = append(args, limit, offset)

	var users []model.User
	err := r.db.SelectContext(ctx, &users, query, args...)
	return users, err
}

func (r *UserRepo) CountArtists(ctx context.Context, search, city, tag string) (int, error) {
	query := `SELECT COUNT(*) FROM users u WHERE 1=1`
	args := []interface{}{}
	idx := 1

	if search != "" {
		query += fmt.Sprintf(` AND (u.name ILIKE $%d OR u.handle ILIKE $%d OR u.bio ILIKE $%d)`, idx, idx, idx)
		args = append(args, "%"+search+"%")
		idx++
	}
	if city != "" {
		query += fmt.Sprintf(` AND u.location ILIKE $%d`, idx)
		args = append(args, "%"+city+"%")
		idx++
	}
	if tag != "" {
		query += fmt.Sprintf(` AND $%d = ANY(u.tags)`, idx)
		args = append(args, tag)
		idx++
	}

	var count int
	err := r.db.GetContext(ctx, &count, query, args...)
	return count, err
}
