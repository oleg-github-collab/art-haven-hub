package repository

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"

	"github.com/art-haven-hub/backend/internal/model"
	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
)

type SocialHubRepo struct {
	db *sqlx.DB
}

func NewSocialHubRepo(db *sqlx.DB) *SocialHubRepo {
	return &SocialHubRepo{db: db}
}

// ═══════════════════════════════════════════════════════════════
//  Social Accounts
// ═══════════════════════════════════════════════════════════════

func (r *SocialHubRepo) GetAccounts(ctx context.Context, userID uuid.UUID) ([]model.SocialAccount, error) {
	var accounts []model.SocialAccount
	err := r.db.SelectContext(ctx, &accounts,
		`SELECT * FROM social_accounts WHERE user_id = $1 ORDER BY platform`, userID)
	if err != nil {
		return nil, fmt.Errorf("listing social accounts: %w", err)
	}
	return accounts, nil
}

func (r *SocialHubRepo) UpsertAccount(ctx context.Context, a *model.SocialAccount) error {
	query := `
		INSERT INTO social_accounts (user_id, platform, handle, connected, followers, auto_post, meta)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		ON CONFLICT (user_id, platform)
		DO UPDATE SET handle = $3, connected = $4, followers = $5, auto_post = $6, meta = $7
		RETURNING id, created_at, updated_at`
	return r.db.QueryRowxContext(ctx, query,
		a.UserID, a.Platform, a.Handle, a.Connected, a.Followers, a.AutoPost, a.Meta,
	).Scan(&a.ID, &a.CreatedAt, &a.UpdatedAt)
}

func (r *SocialHubRepo) UpdateAccountAutoPost(ctx context.Context, userID uuid.UUID, platform string, autoPost bool) error {
	_, err := r.db.ExecContext(ctx,
		`UPDATE social_accounts SET auto_post = $1 WHERE user_id = $2 AND platform = $3`,
		autoPost, userID, platform)
	return err
}

func (r *SocialHubRepo) DisconnectAccount(ctx context.Context, userID uuid.UUID, platform string) error {
	_, err := r.db.ExecContext(ctx,
		`UPDATE social_accounts SET connected = false, handle = '', followers = 0, auto_post = false WHERE user_id = $1 AND platform = $2`,
		userID, platform)
	return err
}

// ═══════════════════════════════════════════════════════════════
//  Scheduled Posts
// ═══════════════════════════════════════════════════════════════

type ScheduledPostFilter struct {
	DateFrom string // YYYY-MM-DD
	DateTo   string // YYYY-MM-DD
	Status   string
	Platform string
}

func (r *SocialHubRepo) CreatePost(ctx context.Context, p *model.ScheduledPost) error {
	query := `
		INSERT INTO scheduled_posts (user_id, title, platform, caption, date, time, status, artwork_id, campaign_id, meta)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		RETURNING id, created_at, updated_at`
	return r.db.QueryRowxContext(ctx, query,
		p.UserID, p.Title, p.Platform, p.Caption, p.Date, p.Time, p.Status,
		p.ArtworkID, p.CampaignID, p.Meta,
	).Scan(&p.ID, &p.CreatedAt, &p.UpdatedAt)
}

func (r *SocialHubRepo) GetPost(ctx context.Context, id uuid.UUID) (*model.ScheduledPost, error) {
	var p model.ScheduledPost
	err := r.db.GetContext(ctx, &p, `SELECT * FROM scheduled_posts WHERE id = $1`, id)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	return &p, err
}

func (r *SocialHubRepo) ListPosts(ctx context.Context, userID uuid.UUID, f ScheduledPostFilter) ([]model.ScheduledPost, error) {
	conditions := []string{"user_id = $1"}
	args := []interface{}{userID}
	argN := 2

	if f.DateFrom != "" {
		conditions = append(conditions, fmt.Sprintf("date >= $%d", argN))
		args = append(args, f.DateFrom)
		argN++
	}
	if f.DateTo != "" {
		conditions = append(conditions, fmt.Sprintf("date <= $%d", argN))
		args = append(args, f.DateTo)
		argN++
	}
	if f.Status != "" {
		conditions = append(conditions, fmt.Sprintf("status = $%d", argN))
		args = append(args, f.Status)
		argN++
	}
	if f.Platform != "" {
		conditions = append(conditions, fmt.Sprintf("platform = $%d", argN))
		args = append(args, f.Platform)
		argN++
	}

	query := fmt.Sprintf(
		`SELECT * FROM scheduled_posts WHERE %s ORDER BY date ASC, time ASC`,
		strings.Join(conditions, " AND "),
	)

	var posts []model.ScheduledPost
	err := r.db.SelectContext(ctx, &posts, query, args...)
	if err != nil {
		return nil, fmt.Errorf("listing scheduled posts: %w", err)
	}
	return posts, nil
}

func (r *SocialHubRepo) UpdatePost(ctx context.Context, p *model.ScheduledPost) error {
	query := `
		UPDATE scheduled_posts
		SET title = $1, platform = $2, caption = $3, date = $4, time = $5, status = $6, retries = $7,
		    artwork_id = $8, campaign_id = $9, meta = $10
		WHERE id = $11
		RETURNING updated_at`
	return r.db.QueryRowxContext(ctx, query,
		p.Title, p.Platform, p.Caption, p.Date, p.Time, p.Status, p.Retries,
		p.ArtworkID, p.CampaignID, p.Meta, p.ID,
	).Scan(&p.UpdatedAt)
}

func (r *SocialHubRepo) DeletePost(ctx context.Context, id uuid.UUID) error {
	_, err := r.db.ExecContext(ctx, `DELETE FROM scheduled_posts WHERE id = $1`, id)
	return err
}

func (r *SocialHubRepo) UpdatePostStatus(ctx context.Context, id uuid.UUID, status string) error {
	_, err := r.db.ExecContext(ctx,
		`UPDATE scheduled_posts SET status = $1 WHERE id = $2`, status, id)
	return err
}

func (r *SocialHubRepo) IncrementRetries(ctx context.Context, id uuid.UUID) error {
	_, err := r.db.ExecContext(ctx,
		`UPDATE scheduled_posts SET retries = retries + 1 WHERE id = $1`, id)
	return err
}

func (r *SocialHubRepo) ClearCompletedPosts(ctx context.Context, userID uuid.UUID) (int64, error) {
	res, err := r.db.ExecContext(ctx,
		`DELETE FROM scheduled_posts WHERE user_id = $1 AND status = 'published'`, userID)
	if err != nil {
		return 0, err
	}
	return res.RowsAffected()
}

// Queue: pending posts ready to process
func (r *SocialHubRepo) GetQueue(ctx context.Context, userID uuid.UUID) ([]model.ScheduledPost, error) {
	var posts []model.ScheduledPost
	err := r.db.SelectContext(ctx, &posts,
		`SELECT * FROM scheduled_posts
		 WHERE user_id = $1 AND status IN ('scheduled', 'processing', 'published', 'failed', 'paused')
		 ORDER BY date ASC, time ASC`, userID)
	if err != nil {
		return nil, fmt.Errorf("getting post queue: %w", err)
	}
	return posts, nil
}

// ═══════════════════════════════════════════════════════════════
//  Campaigns
// ═══════════════════════════════════════════════════════════════

func (r *SocialHubRepo) CreateCampaign(ctx context.Context, c *model.Campaign) error {
	query := `
		INSERT INTO campaigns (user_id, name, platforms, status, scheduled_at, meta)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, created_at, updated_at`
	return r.db.QueryRowxContext(ctx, query,
		c.UserID, c.Name, c.Platforms, c.Status, c.ScheduledAt, c.Meta,
	).Scan(&c.ID, &c.CreatedAt, &c.UpdatedAt)
}

func (r *SocialHubRepo) GetCampaign(ctx context.Context, id uuid.UUID) (*model.Campaign, error) {
	var c model.Campaign
	err := r.db.GetContext(ctx, &c, `SELECT * FROM campaigns WHERE id = $1`, id)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	return &c, err
}

func (r *SocialHubRepo) ListCampaigns(ctx context.Context, userID uuid.UUID) ([]model.Campaign, error) {
	var campaigns []model.Campaign
	err := r.db.SelectContext(ctx, &campaigns,
		`SELECT * FROM campaigns WHERE user_id = $1 ORDER BY created_at DESC`, userID)
	if err != nil {
		return nil, fmt.Errorf("listing campaigns: %w", err)
	}
	return campaigns, nil
}

func (r *SocialHubRepo) UpdateCampaign(ctx context.Context, c *model.Campaign) error {
	query := `
		UPDATE campaigns
		SET name = $1, platforms = $2, status = $3, scheduled_at = $4, reach = $5, engagement = $6, meta = $7
		WHERE id = $8
		RETURNING updated_at`
	return r.db.QueryRowxContext(ctx, query,
		c.Name, c.Platforms, c.Status, c.ScheduledAt, c.Reach, c.Engagement, c.Meta, c.ID,
	).Scan(&c.UpdatedAt)
}

func (r *SocialHubRepo) DeleteCampaign(ctx context.Context, id uuid.UUID) error {
	_, err := r.db.ExecContext(ctx, `DELETE FROM campaigns WHERE id = $1`, id)
	return err
}

// ═══════════════════════════════════════════════════════════════
//  Workflows
// ═══════════════════════════════════════════════════════════════

func (r *SocialHubRepo) CreateWorkflow(ctx context.Context, w *model.Workflow) error {
	query := `
		INSERT INTO workflows (user_id, name, description, icon, nodes, connections, is_public)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, created_at, updated_at`
	return r.db.QueryRowxContext(ctx, query,
		w.UserID, w.Name, w.Description, w.Icon, w.Nodes, w.Connections, w.IsPublic,
	).Scan(&w.ID, &w.CreatedAt, &w.UpdatedAt)
}

func (r *SocialHubRepo) GetWorkflow(ctx context.Context, id uuid.UUID) (*model.Workflow, error) {
	var w model.Workflow
	err := r.db.GetContext(ctx, &w, `SELECT * FROM workflows WHERE id = $1`, id)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	return &w, err
}

func (r *SocialHubRepo) ListWorkflows(ctx context.Context, userID uuid.UUID) ([]model.Workflow, error) {
	var workflows []model.Workflow
	err := r.db.SelectContext(ctx, &workflows,
		`SELECT * FROM workflows WHERE user_id = $1 ORDER BY updated_at DESC`, userID)
	if err != nil {
		return nil, fmt.Errorf("listing workflows: %w", err)
	}
	return workflows, nil
}

func (r *SocialHubRepo) ListPublicWorkflows(ctx context.Context) ([]model.Workflow, error) {
	var workflows []model.Workflow
	err := r.db.SelectContext(ctx, &workflows,
		`SELECT * FROM workflows WHERE is_public = true ORDER BY created_at DESC LIMIT 50`)
	if err != nil {
		return nil, fmt.Errorf("listing public workflows: %w", err)
	}
	return workflows, nil
}

func (r *SocialHubRepo) UpdateWorkflow(ctx context.Context, w *model.Workflow) error {
	query := `
		UPDATE workflows
		SET name = $1, description = $2, icon = $3, nodes = $4, connections = $5, is_public = $6
		WHERE id = $7
		RETURNING updated_at`
	return r.db.QueryRowxContext(ctx, query,
		w.Name, w.Description, w.Icon, w.Nodes, w.Connections, w.IsPublic, w.ID,
	).Scan(&w.UpdatedAt)
}

func (r *SocialHubRepo) DeleteWorkflow(ctx context.Context, id uuid.UUID) error {
	_, err := r.db.ExecContext(ctx, `DELETE FROM workflows WHERE id = $1`, id)
	return err
}

// ─── Stats ───

type SocialHubStats struct {
	ConnectedAccounts int `db:"connected_accounts" json:"connected_accounts"`
	ActiveCampaigns   int `db:"active_campaigns" json:"active_campaigns"`
	TotalReach        int `db:"total_reach" json:"total_reach"`
	TotalEngagement   int `db:"total_engagement" json:"total_engagement"`
	ScheduledPosts    int `db:"scheduled_posts" json:"scheduled_posts"`
}

func (r *SocialHubRepo) GetStats(ctx context.Context, userID uuid.UUID) (*SocialHubStats, error) {
	var stats SocialHubStats
	err := r.db.GetContext(ctx, &stats, `
		SELECT
			(SELECT COUNT(*) FROM social_accounts WHERE user_id = $1 AND connected = true) AS connected_accounts,
			(SELECT COUNT(*) FROM campaigns WHERE user_id = $1 AND status = 'active') AS active_campaigns,
			(SELECT COALESCE(SUM(reach), 0) FROM campaigns WHERE user_id = $1) AS total_reach,
			(SELECT COALESCE(SUM(engagement), 0) FROM campaigns WHERE user_id = $1) AS total_engagement,
			(SELECT COUNT(*) FROM scheduled_posts WHERE user_id = $1 AND status = 'scheduled') AS scheduled_posts
	`, userID)
	if err != nil {
		return nil, fmt.Errorf("getting social hub stats: %w", err)
	}
	return &stats, nil
}
