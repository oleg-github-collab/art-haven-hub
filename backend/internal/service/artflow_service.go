package service

import (
	"bytes"
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/art-haven-hub/backend/internal/connector"
	"github.com/art-haven-hub/backend/internal/model"
	"github.com/art-haven-hub/backend/internal/pkg/apperror"
	"github.com/art-haven-hub/backend/internal/repository"
	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
)

type ArtflowService struct {
	connectorRepo *repository.ConnectorRepo
	socialRepo    *repository.SocialHubRepo
	registry      *connector.Registry
	rdb           *redis.Client
	openAIKey     string
}

func NewArtflowService(
	connectorRepo *repository.ConnectorRepo,
	socialRepo *repository.SocialHubRepo,
	registry *connector.Registry,
	rdb *redis.Client,
	openAIKey string,
) *ArtflowService {
	return &ArtflowService{
		connectorRepo: connectorRepo,
		socialRepo:    socialRepo,
		registry:      registry,
		rdb:           rdb,
		openAIKey:     openAIKey,
	}
}

// ═══════════════════════════════════════════════════════════════
//  Connector Management
// ═══════════════════════════════════════════════════════════════

type AddConnectorInput struct {
	Platform    string          `json:"platform" validate:"required"`
	Credentials json.RawMessage `json:"credentials" validate:"required"`
}

func (s *ArtflowService) ListConnectors(ctx context.Context, userID uuid.UUID) ([]model.Connector, error) {
	return s.connectorRepo.List(ctx, userID)
}

func (s *ArtflowService) AddConnector(ctx context.Context, userID uuid.UUID, input *AddConnectorInput) (*model.Connector, error) {
	if !s.registry.HasPlatform(input.Platform) {
		return nil, apperror.BadRequest("unsupported platform: " + input.Platform)
	}

	c := &model.Connector{
		UserID:      userID,
		Platform:    input.Platform,
		Credentials: input.Credentials,
		Status:      "active",
		Meta:        json.RawMessage(`{}`),
	}
	if err := s.connectorRepo.Upsert(ctx, c); err != nil {
		return nil, fmt.Errorf("adding connector: %w", err)
	}
	return c, nil
}

func (s *ArtflowService) RemoveConnector(ctx context.Context, userID uuid.UUID, platform string) error {
	return s.connectorRepo.Delete(ctx, userID, platform)
}

func (s *ArtflowService) TestConnector(ctx context.Context, userID uuid.UUID, platform string) error {
	c, err := s.connectorRepo.Get(ctx, userID, platform)
	if err != nil {
		return err
	}
	if c == nil {
		return apperror.NotFound("connector", platform)
	}

	conn, err := s.registry.Create(platform, c.Credentials)
	if err != nil {
		s.connectorRepo.UpdateStatus(ctx, userID, platform, "error")
		return fmt.Errorf("connector init failed: %w", err)
	}

	if err := conn.ValidateCredentials(ctx); err != nil {
		s.connectorRepo.UpdateStatus(ctx, userID, platform, "error")
		return err
	}

	s.connectorRepo.UpdateStatus(ctx, userID, platform, "active")
	return nil
}

// ═══════════════════════════════════════════════════════════════
//  OAuth Flows
// ═══════════════════════════════════════════════════════════════

type OAuthConfig struct {
	ClientID     string
	ClientSecret string
	RedirectURI  string
	AuthURL      string
	TokenURL     string
	Scopes       []string
}

func (s *ArtflowService) GetOAuthURL(platform string, configs map[string]*OAuthConfig) (string, error) {
	cfg, ok := configs[platform]
	if !ok || cfg.ClientID == "" {
		return "", apperror.BadRequest("OAuth not configured for " + platform)
	}
	state := generateSecret(16)
	url := fmt.Sprintf("%s?client_id=%s&redirect_uri=%s&response_type=code&scope=%s&state=%s",
		cfg.AuthURL, cfg.ClientID, cfg.RedirectURI, joinScopes(cfg.Scopes), state)
	return url, nil
}

type OAuthCallbackInput struct {
	Code  string `json:"code" validate:"required"`
	State string `json:"state"`
}

func (s *ArtflowService) HandleOAuthCallback(ctx context.Context, userID uuid.UUID, platform string, input *OAuthCallbackInput, configs map[string]*OAuthConfig) (*model.Connector, error) {
	cfg, ok := configs[platform]
	if !ok || cfg.ClientID == "" {
		return nil, apperror.BadRequest("OAuth not configured for " + platform)
	}

	// Exchange code for token
	body := fmt.Sprintf("grant_type=authorization_code&code=%s&redirect_uri=%s&client_id=%s&client_secret=%s",
		input.Code, cfg.RedirectURI, cfg.ClientID, cfg.ClientSecret)

	req, _ := http.NewRequestWithContext(ctx, "POST", cfg.TokenURL, bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	client := &http.Client{Timeout: 15 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("oauth token exchange failed: %w", err)
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("oauth error %d: %s", resp.StatusCode, string(respBody))
	}

	c := &model.Connector{
		UserID:      userID,
		Platform:    platform,
		Credentials: json.RawMessage(respBody),
		Status:      "active",
		Scopes:      model.StringArray(cfg.Scopes),
		Meta:        json.RawMessage(`{}`),
	}
	if err := s.connectorRepo.Upsert(ctx, c); err != nil {
		return nil, fmt.Errorf("saving oauth connector: %w", err)
	}
	return c, nil
}

// ═══════════════════════════════════════════════════════════════
//  Workflow Execution
// ═══════════════════════════════════════════════════════════════

func (s *ArtflowService) ExecuteWorkflow(ctx context.Context, userID, workflowID uuid.UUID, triggerType string) (*model.WorkflowExecution, error) {
	wf, err := s.socialRepo.GetWorkflow(ctx, workflowID)
	if err != nil {
		return nil, err
	}
	if wf == nil {
		return nil, apperror.NotFound("workflow", workflowID.String())
	}
	if wf.UserID != userID {
		return nil, apperror.Forbidden("not your workflow")
	}

	exec := &model.WorkflowExecution{
		WorkflowID:  workflowID,
		UserID:      userID,
		TriggerType: triggerType,
		Status:      "queued",
	}
	if err := s.connectorRepo.CreateExecution(ctx, exec); err != nil {
		return nil, fmt.Errorf("creating execution: %w", err)
	}

	if err := s.rdb.RPush(ctx, "workflow:execute", exec.ID.String()).Err(); err != nil {
		errMsg := "failed to enqueue"
		s.connectorRepo.UpdateExecutionStatus(ctx, exec.ID, "failed", &errMsg)
		return nil, fmt.Errorf("enqueue failed: %w", err)
	}

	return exec, nil
}

func (s *ArtflowService) TestWorkflow(ctx context.Context, userID, workflowID uuid.UUID) (*model.WorkflowExecution, error) {
	return s.ExecuteWorkflow(ctx, userID, workflowID, "test")
}

func (s *ArtflowService) GetExecution(ctx context.Context, userID, execID uuid.UUID) (*model.WorkflowExecution, error) {
	exec, err := s.connectorRepo.GetExecution(ctx, execID)
	if err != nil {
		return nil, err
	}
	if exec == nil {
		return nil, apperror.NotFound("execution", execID.String())
	}
	if exec.UserID != userID {
		return nil, apperror.Forbidden("not your execution")
	}

	logs, _ := s.connectorRepo.GetNodeLogs(ctx, execID)
	exec.NodeLogs = logs
	return exec, nil
}

func (s *ArtflowService) ListExecutions(ctx context.Context, userID uuid.UUID, limit int) ([]model.WorkflowExecution, error) {
	return s.connectorRepo.ListExecutions(ctx, userID, limit)
}

func (s *ArtflowService) CancelExecution(ctx context.Context, userID, execID uuid.UUID) error {
	exec, err := s.connectorRepo.GetExecution(ctx, execID)
	if err != nil {
		return err
	}
	if exec == nil {
		return apperror.NotFound("execution", execID.String())
	}
	if exec.UserID != userID {
		return apperror.Forbidden("not your execution")
	}
	if exec.Status != "queued" && exec.Status != "running" {
		return apperror.BadRequest("execution cannot be cancelled in state: " + exec.Status)
	}
	errMsg := "cancelled by user"
	return s.connectorRepo.UpdateExecutionStatus(ctx, execID, "cancelled", &errMsg)
}

// ═══════════════════════════════════════════════════════════════
//  Webhooks
// ═══════════════════════════════════════════════════════════════

func (s *ArtflowService) CreateWebhook(ctx context.Context, userID, workflowID uuid.UUID) (*model.WebhookEndpoint, error) {
	wf, err := s.socialRepo.GetWorkflow(ctx, workflowID)
	if err != nil || wf == nil {
		return nil, apperror.NotFound("workflow", workflowID.String())
	}
	if wf.UserID != userID {
		return nil, apperror.Forbidden("not your workflow")
	}

	wh := &model.WebhookEndpoint{
		UserID:     userID,
		WorkflowID: workflowID,
		Secret:     generateSecret(32),
		IsActive:   true,
	}
	if err := s.connectorRepo.CreateWebhook(ctx, wh); err != nil {
		return nil, fmt.Errorf("creating webhook: %w", err)
	}
	return wh, nil
}

func (s *ArtflowService) DeleteWebhook(ctx context.Context, userID, webhookID uuid.UUID) error {
	wh, err := s.connectorRepo.GetWebhook(ctx, webhookID)
	if err != nil || wh == nil {
		return apperror.NotFound("webhook", webhookID.String())
	}
	if wh.UserID != userID {
		return apperror.Forbidden("not your webhook")
	}
	return s.connectorRepo.DeleteWebhook(ctx, webhookID)
}

func (s *ArtflowService) TriggerWebhook(ctx context.Context, webhookID uuid.UUID) (*model.WorkflowExecution, error) {
	wh, err := s.connectorRepo.GetWebhook(ctx, webhookID)
	if err != nil || wh == nil {
		return nil, apperror.NotFound("webhook", webhookID.String())
	}
	if !wh.IsActive {
		return nil, apperror.BadRequest("webhook is inactive")
	}
	s.connectorRepo.TouchWebhook(ctx, webhookID)
	return s.ExecuteWorkflow(ctx, wh.UserID, wh.WorkflowID, "webhook")
}

func (s *ArtflowService) ListWebhooks(ctx context.Context, userID uuid.UUID) ([]model.WebhookEndpoint, error) {
	return s.connectorRepo.ListWebhooks(ctx, userID)
}

// ═══════════════════════════════════════════════════════════════
//  AI Assistant
// ═══════════════════════════════════════════════════════════════

type AIGenerateInput struct {
	Prompt string `json:"prompt" validate:"required,min=5,max=1000"`
}

type AIWorkflowResult struct {
	Nodes       json.RawMessage `json:"nodes"`
	Connections json.RawMessage `json:"connections"`
	Explanation string          `json:"explanation"`
}

func (s *ArtflowService) AIGenerateWorkflow(ctx context.Context, input *AIGenerateInput) (*AIWorkflowResult, error) {
	if s.openAIKey == "" {
		return nil, apperror.BadRequest("AI assistant not configured")
	}

	systemPrompt := `You are an AI assistant for ArtFlow, a workflow automation platform for artists.
Given a user's request, generate a workflow as JSON with nodes and connections.

Available node types:
- Source: artwork_source, text_source, gallery_source, video_source
- AI: ai_adapt, ai_caption, ai_hashtags, ai_translate, ai_describe
- Platforms: pinterest, etsy, shopify, instagram, tiktok, x, facebook, threads
- Actions: schedule, printful_sync, analytics_track, cloudinary_upload, cloudinary_optimize

Each node has: id (unique string), type (from above), label (display name), config (object), position ({x, y}).
Connections have: from (node id) and to (node id).

Position nodes left-to-right: source at x=100, processing at x=350, destinations at x=600.
Space them vertically with y starting at 100, incrementing by 150.

Respond with JSON only: {"nodes": [...], "connections": [...], "explanation": "brief description"}`

	body := map[string]interface{}{
		"model": "gpt-4o-mini",
		"messages": []map[string]string{
			{"role": "system", "content": systemPrompt},
			{"role": "user", "content": input.Prompt},
		},
		"max_tokens":  1500,
		"temperature": 0.7,
	}

	jsonBody, _ := json.Marshal(body)
	req, _ := http.NewRequestWithContext(ctx, "POST", "https://api.openai.com/v1/chat/completions", bytes.NewReader(jsonBody))
	req.Header.Set("Authorization", "Bearer "+s.openAIKey)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("ai request failed: %w", err)
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("ai error %d: %s", resp.StatusCode, string(respBody))
	}

	var result struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
	}
	json.Unmarshal(respBody, &result)
	if len(result.Choices) == 0 {
		return nil, fmt.Errorf("no AI response")
	}

	content := result.Choices[0].Message.Content
	// Try to parse as JSON
	var aiResult AIWorkflowResult
	if err := json.Unmarshal([]byte(content), &aiResult); err != nil {
		// If it can't parse, return as explanation
		return &AIWorkflowResult{
			Nodes:       json.RawMessage(`[]`),
			Connections: json.RawMessage(`[]`),
			Explanation: content,
		}, nil
	}
	return &aiResult, nil
}

type AISuggestInput struct {
	NodeType string          `json:"node_type" validate:"required"`
	Context  json.RawMessage `json:"context"`
}

func (s *ArtflowService) AISuggestConfig(ctx context.Context, input *AISuggestInput) (json.RawMessage, error) {
	if s.openAIKey == "" {
		return nil, apperror.BadRequest("AI assistant not configured")
	}

	prompt := fmt.Sprintf("Suggest optimal configuration for a '%s' node in an art automation workflow. Context: %s. Return JSON config only.", input.NodeType, string(input.Context))
	body := map[string]interface{}{
		"model": "gpt-4o-mini",
		"messages": []map[string]string{
			{"role": "system", "content": "You suggest workflow node configurations for artists. Return JSON only."},
			{"role": "user", "content": prompt},
		},
		"max_tokens": 500,
	}

	jsonBody, _ := json.Marshal(body)
	req, _ := http.NewRequestWithContext(ctx, "POST", "https://api.openai.com/v1/chat/completions", bytes.NewReader(jsonBody))
	req.Header.Set("Authorization", "Bearer "+s.openAIKey)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 15 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	var result struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
	}
	json.Unmarshal(respBody, &result)
	if len(result.Choices) == 0 {
		return json.RawMessage(`{}`), nil
	}

	content := result.Choices[0].Message.Content
	if json.Valid([]byte(content)) {
		return json.RawMessage(content), nil
	}
	return json.RawMessage(`{}`), nil
}

type AIExplainInput struct {
	Nodes       json.RawMessage `json:"nodes" validate:"required"`
	Connections json.RawMessage `json:"connections" validate:"required"`
}

func (s *ArtflowService) AIExplain(ctx context.Context, input *AIExplainInput) (string, error) {
	if s.openAIKey == "" {
		return "", apperror.BadRequest("AI assistant not configured")
	}

	prompt := fmt.Sprintf("Explain what this workflow does in 2-3 sentences. Nodes: %s. Connections: %s", string(input.Nodes), string(input.Connections))
	body := map[string]interface{}{
		"model": "gpt-4o-mini",
		"messages": []map[string]string{
			{"role": "system", "content": "You explain art automation workflows to artists in simple terms."},
			{"role": "user", "content": prompt},
		},
		"max_tokens": 200,
	}

	jsonBody, _ := json.Marshal(body)
	req, _ := http.NewRequestWithContext(ctx, "POST", "https://api.openai.com/v1/chat/completions", bytes.NewReader(jsonBody))
	req.Header.Set("Authorization", "Bearer "+s.openAIKey)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 15 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	var result struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
	}
	json.Unmarshal(respBody, &result)
	if len(result.Choices) == 0 {
		return "Unable to analyze workflow", nil
	}
	return result.Choices[0].Message.Content, nil
}

// ═══════════════════════════════════════════════════════════════
//  Helpers
// ═══════════════════════════════════════════════════════════════

func generateSecret(length int) string {
	b := make([]byte, length)
	rand.Read(b)
	return hex.EncodeToString(b)
}

func joinScopes(scopes []string) string {
	result := ""
	for i, s := range scopes {
		if i > 0 {
			result += ","
		}
		result += s
	}
	return result
}
