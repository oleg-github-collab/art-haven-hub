package service

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/art-haven-hub/backend/internal/model"
	"github.com/art-haven-hub/backend/internal/pkg/apperror"
	"github.com/art-haven-hub/backend/internal/repository"
	"github.com/google/uuid"
)

type SocialHubService struct {
	repo *repository.SocialHubRepo
}

func NewSocialHubService(repo *repository.SocialHubRepo) *SocialHubService {
	return &SocialHubService{repo: repo}
}

// ═══════════════════════════════════════════════════════════════
//  Social Accounts
// ═══════════════════════════════════════════════════════════════

type ConnectAccountInput struct {
	Platform string `json:"platform" validate:"required,oneof=instagram pinterest etsy tiktok x facebook threads printful"`
	Handle   string `json:"handle" validate:"required,max=100"`
}

func (s *SocialHubService) GetAccounts(ctx context.Context, userID uuid.UUID) ([]model.SocialAccount, error) {
	accounts, err := s.repo.GetAccounts(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("getting accounts: %w", err)
	}
	return accounts, nil
}

func (s *SocialHubService) ConnectAccount(ctx context.Context, userID uuid.UUID, input *ConnectAccountInput) (*model.SocialAccount, error) {
	acc := &model.SocialAccount{
		UserID:    userID,
		Platform:  input.Platform,
		Handle:    input.Handle,
		Connected: true,
		Meta:      json.RawMessage(`{}`),
	}
	if err := s.repo.UpsertAccount(ctx, acc); err != nil {
		return nil, fmt.Errorf("connecting account: %w", err)
	}
	return acc, nil
}

func (s *SocialHubService) DisconnectAccount(ctx context.Context, userID uuid.UUID, platform string) error {
	return s.repo.DisconnectAccount(ctx, userID, platform)
}

type UpdateAutoPostInput struct {
	Platform string `json:"platform" validate:"required"`
	AutoPost bool   `json:"auto_post"`
}

func (s *SocialHubService) UpdateAutoPost(ctx context.Context, userID uuid.UUID, input *UpdateAutoPostInput) error {
	return s.repo.UpdateAccountAutoPost(ctx, userID, input.Platform, input.AutoPost)
}

// ═══════════════════════════════════════════════════════════════
//  Scheduled Posts
// ═══════════════════════════════════════════════════════════════

type CreateScheduledPostInput struct {
	Title      string     `json:"title" validate:"required,min=1,max=200"`
	Platform   string     `json:"platform" validate:"required,oneof=instagram pinterest etsy tiktok x facebook threads printful"`
	Caption    string     `json:"caption" validate:"omitempty,max=5000"`
	Date       string     `json:"date" validate:"required"`
	Time       string     `json:"time" validate:"required"`
	ArtworkID  *uuid.UUID `json:"artwork_id"`
	CampaignID *uuid.UUID `json:"campaign_id"`
}

type UpdateScheduledPostInput struct {
	Title    *string `json:"title" validate:"omitempty,min=1,max=200"`
	Platform *string `json:"platform" validate:"omitempty,oneof=instagram pinterest etsy tiktok x facebook threads printful"`
	Caption  *string `json:"caption" validate:"omitempty,max=5000"`
	Date     *string `json:"date"`
	Time     *string `json:"time"`
	Status   *string `json:"status" validate:"omitempty,oneof=draft scheduled published failed processing paused"`
}

func (s *SocialHubService) CreatePost(ctx context.Context, userID uuid.UUID, input *CreateScheduledPostInput) (*model.ScheduledPost, error) {
	status := "scheduled"
	p := &model.ScheduledPost{
		UserID:     userID,
		Title:      input.Title,
		Platform:   input.Platform,
		Caption:    input.Caption,
		Date:       input.Date,
		Time:       input.Time,
		Status:     status,
		ArtworkID:  input.ArtworkID,
		CampaignID: input.CampaignID,
		Meta:       json.RawMessage(`{}`),
	}
	if err := s.repo.CreatePost(ctx, p); err != nil {
		return nil, fmt.Errorf("creating post: %w", err)
	}
	return p, nil
}

func (s *SocialHubService) GetPost(ctx context.Context, userID, postID uuid.UUID) (*model.ScheduledPost, error) {
	p, err := s.repo.GetPost(ctx, postID)
	if err != nil {
		return nil, fmt.Errorf("getting post: %w", err)
	}
	if p == nil {
		return nil, apperror.NotFound("scheduled_post", postID.String())
	}
	if p.UserID != userID {
		return nil, apperror.Forbidden("not your post")
	}
	return p, nil
}

func (s *SocialHubService) ListPosts(ctx context.Context, userID uuid.UUID, f repository.ScheduledPostFilter) ([]model.ScheduledPost, error) {
	posts, err := s.repo.ListPosts(ctx, userID, f)
	if err != nil {
		return nil, fmt.Errorf("listing posts: %w", err)
	}
	return posts, nil
}

func (s *SocialHubService) UpdatePost(ctx context.Context, userID, postID uuid.UUID, input *UpdateScheduledPostInput) (*model.ScheduledPost, error) {
	p, err := s.repo.GetPost(ctx, postID)
	if err != nil {
		return nil, fmt.Errorf("getting post: %w", err)
	}
	if p == nil {
		return nil, apperror.NotFound("scheduled_post", postID.String())
	}
	if p.UserID != userID {
		return nil, apperror.Forbidden("not your post")
	}

	if input.Title != nil {
		p.Title = *input.Title
	}
	if input.Platform != nil {
		p.Platform = *input.Platform
	}
	if input.Caption != nil {
		p.Caption = *input.Caption
	}
	if input.Date != nil {
		p.Date = *input.Date
	}
	if input.Time != nil {
		p.Time = *input.Time
	}
	if input.Status != nil {
		p.Status = *input.Status
	}

	if err := s.repo.UpdatePost(ctx, p); err != nil {
		return nil, fmt.Errorf("updating post: %w", err)
	}
	return p, nil
}

func (s *SocialHubService) DeletePost(ctx context.Context, userID, postID uuid.UUID) error {
	p, err := s.repo.GetPost(ctx, postID)
	if err != nil {
		return fmt.Errorf("getting post: %w", err)
	}
	if p == nil {
		return apperror.NotFound("scheduled_post", postID.String())
	}
	if p.UserID != userID {
		return apperror.Forbidden("not your post")
	}
	return s.repo.DeletePost(ctx, postID)
}

func (s *SocialHubService) DuplicatePost(ctx context.Context, userID, postID uuid.UUID) (*model.ScheduledPost, error) {
	original, err := s.repo.GetPost(ctx, postID)
	if err != nil {
		return nil, fmt.Errorf("getting post: %w", err)
	}
	if original == nil {
		return nil, apperror.NotFound("scheduled_post", postID.String())
	}
	if original.UserID != userID {
		return nil, apperror.Forbidden("not your post")
	}

	dup := &model.ScheduledPost{
		UserID:     userID,
		Title:      original.Title,
		Platform:   original.Platform,
		Caption:    original.Caption,
		Date:       original.Date,
		Time:       original.Time,
		Status:     "draft",
		ArtworkID:  original.ArtworkID,
		CampaignID: original.CampaignID,
		Meta:       original.Meta,
	}
	if err := s.repo.CreatePost(ctx, dup); err != nil {
		return nil, fmt.Errorf("duplicating post: %w", err)
	}
	return dup, nil
}

func (s *SocialHubService) GetQueue(ctx context.Context, userID uuid.UUID) ([]model.ScheduledPost, error) {
	return s.repo.GetQueue(ctx, userID)
}

func (s *SocialHubService) RetryPost(ctx context.Context, userID, postID uuid.UUID) (*model.ScheduledPost, error) {
	p, err := s.repo.GetPost(ctx, postID)
	if err != nil {
		return nil, fmt.Errorf("getting post: %w", err)
	}
	if p == nil {
		return nil, apperror.NotFound("scheduled_post", postID.String())
	}
	if p.UserID != userID {
		return nil, apperror.Forbidden("not your post")
	}
	p.Status = "scheduled"
	p.Retries = 0
	if err := s.repo.UpdatePost(ctx, p); err != nil {
		return nil, fmt.Errorf("retrying post: %w", err)
	}
	return p, nil
}

func (s *SocialHubService) ClearCompleted(ctx context.Context, userID uuid.UUID) (int64, error) {
	return s.repo.ClearCompletedPosts(ctx, userID)
}

// ═══════════════════════════════════════════════════════════════
//  Campaigns
// ═══════════════════════════════════════════════════════════════

type CreateCampaignInput struct {
	Name      string   `json:"name" validate:"required,min=1,max=200"`
	Platforms []string `json:"platforms" validate:"required,min=1"`
	Status    string   `json:"status" validate:"omitempty,oneof=draft scheduled active completed"`
}

type UpdateCampaignInput struct {
	Name      *string  `json:"name" validate:"omitempty,min=1,max=200"`
	Platforms []string `json:"platforms"`
	Status    *string  `json:"status" validate:"omitempty,oneof=draft scheduled active completed"`
}

func (s *SocialHubService) CreateCampaign(ctx context.Context, userID uuid.UUID, input *CreateCampaignInput) (*model.Campaign, error) {
	status := input.Status
	if status == "" {
		status = "draft"
	}
	c := &model.Campaign{
		UserID:    userID,
		Name:      input.Name,
		Platforms: model.StringArray(input.Platforms),
		Status:    status,
		Meta:      json.RawMessage(`{}`),
	}
	if err := s.repo.CreateCampaign(ctx, c); err != nil {
		return nil, fmt.Errorf("creating campaign: %w", err)
	}
	return c, nil
}

func (s *SocialHubService) GetCampaign(ctx context.Context, userID, campaignID uuid.UUID) (*model.Campaign, error) {
	c, err := s.repo.GetCampaign(ctx, campaignID)
	if err != nil {
		return nil, fmt.Errorf("getting campaign: %w", err)
	}
	if c == nil {
		return nil, apperror.NotFound("campaign", campaignID.String())
	}
	if c.UserID != userID {
		return nil, apperror.Forbidden("not your campaign")
	}
	return c, nil
}

func (s *SocialHubService) ListCampaigns(ctx context.Context, userID uuid.UUID) ([]model.Campaign, error) {
	return s.repo.ListCampaigns(ctx, userID)
}

func (s *SocialHubService) UpdateCampaign(ctx context.Context, userID, campaignID uuid.UUID, input *UpdateCampaignInput) (*model.Campaign, error) {
	c, err := s.repo.GetCampaign(ctx, campaignID)
	if err != nil {
		return nil, fmt.Errorf("getting campaign: %w", err)
	}
	if c == nil {
		return nil, apperror.NotFound("campaign", campaignID.String())
	}
	if c.UserID != userID {
		return nil, apperror.Forbidden("not your campaign")
	}

	if input.Name != nil {
		c.Name = *input.Name
	}
	if input.Platforms != nil {
		c.Platforms = model.StringArray(input.Platforms)
	}
	if input.Status != nil {
		c.Status = *input.Status
	}

	if err := s.repo.UpdateCampaign(ctx, c); err != nil {
		return nil, fmt.Errorf("updating campaign: %w", err)
	}
	return c, nil
}

func (s *SocialHubService) DeleteCampaign(ctx context.Context, userID, campaignID uuid.UUID) error {
	c, err := s.repo.GetCampaign(ctx, campaignID)
	if err != nil {
		return fmt.Errorf("getting campaign: %w", err)
	}
	if c == nil {
		return apperror.NotFound("campaign", campaignID.String())
	}
	if c.UserID != userID {
		return apperror.Forbidden("not your campaign")
	}
	return s.repo.DeleteCampaign(ctx, campaignID)
}

// ═══════════════════════════════════════════════════════════════
//  Workflows
// ═══════════════════════════════════════════════════════════════

type CreateWorkflowInput struct {
	Name        string          `json:"name" validate:"required,min=1,max=200"`
	Description string          `json:"description" validate:"omitempty,max=2000"`
	Icon        string          `json:"icon" validate:"omitempty,max=10"`
	Nodes       json.RawMessage `json:"nodes" validate:"required"`
	Connections json.RawMessage `json:"connections"`
	IsPublic    bool            `json:"is_public"`
}

type UpdateWorkflowInput struct {
	Name        *string          `json:"name" validate:"omitempty,min=1,max=200"`
	Description *string          `json:"description" validate:"omitempty,max=2000"`
	Icon        *string          `json:"icon" validate:"omitempty,max=10"`
	Nodes       *json.RawMessage `json:"nodes"`
	Connections *json.RawMessage `json:"connections"`
	IsPublic    *bool            `json:"is_public"`
}

func (s *SocialHubService) CreateWorkflow(ctx context.Context, userID uuid.UUID, input *CreateWorkflowInput) (*model.Workflow, error) {
	conns := input.Connections
	if conns == nil {
		conns = json.RawMessage(`[]`)
	}
	w := &model.Workflow{
		UserID:      userID,
		Name:        input.Name,
		Description: input.Description,
		Icon:        input.Icon,
		Nodes:       input.Nodes,
		Connections: conns,
		IsPublic:    input.IsPublic,
	}
	if err := s.repo.CreateWorkflow(ctx, w); err != nil {
		return nil, fmt.Errorf("creating workflow: %w", err)
	}
	return w, nil
}

func (s *SocialHubService) GetWorkflow(ctx context.Context, userID, workflowID uuid.UUID) (*model.Workflow, error) {
	w, err := s.repo.GetWorkflow(ctx, workflowID)
	if err != nil {
		return nil, fmt.Errorf("getting workflow: %w", err)
	}
	if w == nil {
		return nil, apperror.NotFound("workflow", workflowID.String())
	}
	if w.UserID != userID && !w.IsPublic {
		return nil, apperror.Forbidden("not your workflow")
	}
	return w, nil
}

func (s *SocialHubService) ListWorkflows(ctx context.Context, userID uuid.UUID) ([]model.Workflow, error) {
	return s.repo.ListWorkflows(ctx, userID)
}

func (s *SocialHubService) ListPublicWorkflows(ctx context.Context) ([]model.Workflow, error) {
	return s.repo.ListPublicWorkflows(ctx)
}

func (s *SocialHubService) UpdateWorkflow(ctx context.Context, userID, workflowID uuid.UUID, input *UpdateWorkflowInput) (*model.Workflow, error) {
	w, err := s.repo.GetWorkflow(ctx, workflowID)
	if err != nil {
		return nil, fmt.Errorf("getting workflow: %w", err)
	}
	if w == nil {
		return nil, apperror.NotFound("workflow", workflowID.String())
	}
	if w.UserID != userID {
		return nil, apperror.Forbidden("not your workflow")
	}

	if input.Name != nil {
		w.Name = *input.Name
	}
	if input.Description != nil {
		w.Description = *input.Description
	}
	if input.Icon != nil {
		w.Icon = *input.Icon
	}
	if input.Nodes != nil {
		w.Nodes = *input.Nodes
	}
	if input.Connections != nil {
		w.Connections = *input.Connections
	}
	if input.IsPublic != nil {
		w.IsPublic = *input.IsPublic
	}

	if err := s.repo.UpdateWorkflow(ctx, w); err != nil {
		return nil, fmt.Errorf("updating workflow: %w", err)
	}
	return w, nil
}

func (s *SocialHubService) DeleteWorkflow(ctx context.Context, userID, workflowID uuid.UUID) error {
	w, err := s.repo.GetWorkflow(ctx, workflowID)
	if err != nil {
		return fmt.Errorf("getting workflow: %w", err)
	}
	if w == nil {
		return apperror.NotFound("workflow", workflowID.String())
	}
	if w.UserID != userID {
		return apperror.Forbidden("not your workflow")
	}
	return s.repo.DeleteWorkflow(ctx, workflowID)
}

// ═══════════════════════════════════════════════════════════════
//  Stats
// ═══════════════════════════════════════════════════════════════

func (s *SocialHubService) GetStats(ctx context.Context, userID uuid.UUID) (*repository.SocialHubStats, error) {
	return s.repo.GetStats(ctx, userID)
}
