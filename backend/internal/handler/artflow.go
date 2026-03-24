package handler

import (
	"net/http"
	"strconv"

	"github.com/art-haven-hub/backend/internal/middleware"
	"github.com/art-haven-hub/backend/internal/pkg/response"
	"github.com/art-haven-hub/backend/internal/pkg/validate"
	"github.com/art-haven-hub/backend/internal/service"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

type ArtflowHandler struct {
	svc          *service.ArtflowService
	oauthConfigs map[string]*service.OAuthConfig
}

func NewArtflowHandler(svc *service.ArtflowService, oauthConfigs map[string]*service.OAuthConfig) *ArtflowHandler {
	return &ArtflowHandler{svc: svc, oauthConfigs: oauthConfigs}
}

// ═══════════════════════════════════════════════════════════════
//  Connectors
// ═══════════════════════════════════════════════════════════════

func (h *ArtflowHandler) ListConnectors(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "not authenticated")
		return
	}
	connectors, err := h.svc.ListConnectors(r.Context(), userID)
	if err != nil {
		response.AppError(w, err)
		return
	}
	response.OK(w, connectors)
}

func (h *ArtflowHandler) AddConnector(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "not authenticated")
		return
	}
	var input service.AddConnectorInput
	if err := validate.DecodeAndValidate(r, &input); err != nil {
		response.AppError(w, err)
		return
	}
	c, err := h.svc.AddConnector(r.Context(), userID, &input)
	if err != nil {
		response.AppError(w, err)
		return
	}
	response.Created(w, c)
}

func (h *ArtflowHandler) RemoveConnector(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "not authenticated")
		return
	}
	platform := chi.URLParam(r, "platform")
	if err := h.svc.RemoveConnector(r.Context(), userID, platform); err != nil {
		response.AppError(w, err)
		return
	}
	response.NoContent(w)
}

func (h *ArtflowHandler) TestConnector(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "not authenticated")
		return
	}
	platform := chi.URLParam(r, "platform")
	if err := h.svc.TestConnector(r.Context(), userID, platform); err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.OK(w, map[string]string{"status": "ok"})
}

// ═══════════════════════════════════════════════════════════════
//  OAuth
// ═══════════════════════════════════════════════════════════════

func (h *ArtflowHandler) GetOAuthURL(w http.ResponseWriter, r *http.Request) {
	platform := chi.URLParam(r, "platform")
	url, err := h.svc.GetOAuthURL(platform, h.oauthConfigs)
	if err != nil {
		response.AppError(w, err)
		return
	}
	response.OK(w, map[string]string{"url": url})
}

func (h *ArtflowHandler) OAuthCallback(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "not authenticated")
		return
	}
	platform := chi.URLParam(r, "platform")
	var input service.OAuthCallbackInput
	if err := validate.DecodeAndValidate(r, &input); err != nil {
		response.AppError(w, err)
		return
	}
	c, err := h.svc.HandleOAuthCallback(r.Context(), userID, platform, &input, h.oauthConfigs)
	if err != nil {
		response.AppError(w, err)
		return
	}
	response.OK(w, c)
}

// ═══════════════════════════════════════════════════════════════
//  Workflow Execution
// ═══════════════════════════════════════════════════════════════

func (h *ArtflowHandler) ExecuteWorkflow(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "not authenticated")
		return
	}
	workflowID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "invalid workflow id")
		return
	}
	exec, err := h.svc.ExecuteWorkflow(r.Context(), userID, workflowID, "manual")
	if err != nil {
		response.AppError(w, err)
		return
	}
	response.Created(w, exec)
}

func (h *ArtflowHandler) TestWorkflow(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "not authenticated")
		return
	}
	workflowID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "invalid workflow id")
		return
	}
	exec, err := h.svc.TestWorkflow(r.Context(), userID, workflowID)
	if err != nil {
		response.AppError(w, err)
		return
	}
	response.Created(w, exec)
}

func (h *ArtflowHandler) GetExecution(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "not authenticated")
		return
	}
	execID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "invalid execution id")
		return
	}
	exec, err := h.svc.GetExecution(r.Context(), userID, execID)
	if err != nil {
		response.AppError(w, err)
		return
	}
	response.OK(w, exec)
}

func (h *ArtflowHandler) ListExecutions(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "not authenticated")
		return
	}
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	execs, err := h.svc.ListExecutions(r.Context(), userID, limit)
	if err != nil {
		response.AppError(w, err)
		return
	}
	response.OK(w, execs)
}

func (h *ArtflowHandler) CancelExecution(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "not authenticated")
		return
	}
	execID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "invalid execution id")
		return
	}
	if err := h.svc.CancelExecution(r.Context(), userID, execID); err != nil {
		response.AppError(w, err)
		return
	}
	response.NoContent(w)
}

// ═══════════════════════════════════════════════════════════════
//  Webhooks
// ═══════════════════════════════════════════════════════════════

func (h *ArtflowHandler) CreateWebhook(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "not authenticated")
		return
	}
	var input struct {
		WorkflowID uuid.UUID `json:"workflow_id" validate:"required"`
	}
	if err := validate.DecodeAndValidate(r, &input); err != nil {
		response.AppError(w, err)
		return
	}
	wh, err := h.svc.CreateWebhook(r.Context(), userID, input.WorkflowID)
	if err != nil {
		response.AppError(w, err)
		return
	}
	response.Created(w, wh)
}

func (h *ArtflowHandler) DeleteWebhook(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "not authenticated")
		return
	}
	webhookID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "invalid webhook id")
		return
	}
	if err := h.svc.DeleteWebhook(r.Context(), userID, webhookID); err != nil {
		response.AppError(w, err)
		return
	}
	response.NoContent(w)
}

func (h *ArtflowHandler) ListWebhooks(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "not authenticated")
		return
	}
	webhooks, err := h.svc.ListWebhooks(r.Context(), userID)
	if err != nil {
		response.AppError(w, err)
		return
	}
	response.OK(w, webhooks)
}

func (h *ArtflowHandler) IncomingWebhook(w http.ResponseWriter, r *http.Request) {
	webhookID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "invalid webhook id")
		return
	}
	exec, err := h.svc.TriggerWebhook(r.Context(), webhookID)
	if err != nil {
		response.AppError(w, err)
		return
	}
	response.OK(w, exec)
}

// ═══════════════════════════════════════════════════════════════
//  AI Assistant
// ═══════════════════════════════════════════════════════════════

func (h *ArtflowHandler) AIGenerateWorkflow(w http.ResponseWriter, r *http.Request) {
	var input service.AIGenerateInput
	if err := validate.DecodeAndValidate(r, &input); err != nil {
		response.AppError(w, err)
		return
	}
	result, err := h.svc.AIGenerateWorkflow(r.Context(), &input)
	if err != nil {
		response.AppError(w, err)
		return
	}
	response.OK(w, result)
}

func (h *ArtflowHandler) AISuggestConfig(w http.ResponseWriter, r *http.Request) {
	var input service.AISuggestInput
	if err := validate.DecodeAndValidate(r, &input); err != nil {
		response.AppError(w, err)
		return
	}
	result, err := h.svc.AISuggestConfig(r.Context(), &input)
	if err != nil {
		response.AppError(w, err)
		return
	}
	response.OK(w, result)
}

func (h *ArtflowHandler) AIExplain(w http.ResponseWriter, r *http.Request) {
	var input service.AIExplainInput
	if err := validate.DecodeAndValidate(r, &input); err != nil {
		response.AppError(w, err)
		return
	}
	result, err := h.svc.AIExplain(r.Context(), &input)
	if err != nil {
		response.AppError(w, err)
		return
	}
	response.OK(w, map[string]string{"explanation": result})
}

// ═══════════════════════════════════════════════════════════════
//  Platform-specific Utilities
// ═══════════════════════════════════════════════════════════════

func (h *ArtflowHandler) GetPlatforms(w http.ResponseWriter, r *http.Request) {
	platforms := []map[string]interface{}{
		{"id": "openai", "name": "OpenAI", "category": "ai", "auth_type": "api_key"},
		{"id": "cloudinary", "name": "Cloudinary", "category": "storage", "auth_type": "api_key"},
		{"id": "pinterest", "name": "Pinterest", "category": "social", "auth_type": "oauth2"},
		{"id": "etsy", "name": "Etsy", "category": "marketplace", "auth_type": "oauth2"},
		{"id": "shopify", "name": "Shopify", "category": "marketplace", "auth_type": "oauth2"},
		{"id": "printful", "name": "Printful", "category": "fulfillment", "auth_type": "api_key"},
		{"id": "instagram", "name": "Instagram", "category": "social", "auth_type": "oauth2"},
		{"id": "tiktok", "name": "TikTok", "category": "social", "auth_type": "oauth2"},
	}
	response.OK(w, platforms)
}
