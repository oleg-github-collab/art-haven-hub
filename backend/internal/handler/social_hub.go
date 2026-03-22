package handler

import (
	"net/http"

	"github.com/art-haven-hub/backend/internal/middleware"
	"github.com/art-haven-hub/backend/internal/pkg/response"
	"github.com/art-haven-hub/backend/internal/pkg/validate"
	"github.com/art-haven-hub/backend/internal/repository"
	"github.com/art-haven-hub/backend/internal/service"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

type SocialHubHandler struct {
	svc *service.SocialHubService
}

func NewSocialHubHandler(svc *service.SocialHubService) *SocialHubHandler {
	return &SocialHubHandler{svc: svc}
}

// ═══════════════════════════════════════════════════════════════
//  Social Accounts
// ═══════════════════════════════════════════════════════════════

func (h *SocialHubHandler) GetAccounts(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "not authenticated")
		return
	}
	accounts, err := h.svc.GetAccounts(r.Context(), userID)
	if err != nil {
		response.AppError(w, err)
		return
	}
	response.OK(w, accounts)
}

func (h *SocialHubHandler) ConnectAccount(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "not authenticated")
		return
	}
	var input service.ConnectAccountInput
	if err := validate.DecodeAndValidate(r, &input); err != nil {
		response.AppError(w, err)
		return
	}
	acc, err := h.svc.ConnectAccount(r.Context(), userID, &input)
	if err != nil {
		response.AppError(w, err)
		return
	}
	response.Created(w, acc)
}

func (h *SocialHubHandler) DisconnectAccount(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "not authenticated")
		return
	}
	platform := chi.URLParam(r, "platform")
	if platform == "" {
		response.Error(w, http.StatusBadRequest, "platform is required")
		return
	}
	if err := h.svc.DisconnectAccount(r.Context(), userID, platform); err != nil {
		response.AppError(w, err)
		return
	}
	response.NoContent(w)
}

func (h *SocialHubHandler) UpdateAutoPost(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "not authenticated")
		return
	}
	var input service.UpdateAutoPostInput
	if err := validate.DecodeAndValidate(r, &input); err != nil {
		response.AppError(w, err)
		return
	}
	if err := h.svc.UpdateAutoPost(r.Context(), userID, &input); err != nil {
		response.AppError(w, err)
		return
	}
	response.NoContent(w)
}

// ═══════════════════════════════════════════════════════════════
//  Scheduled Posts
// ═══════════════════════════════════════════════════════════════

func (h *SocialHubHandler) CreatePost(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "not authenticated")
		return
	}
	var input service.CreateScheduledPostInput
	if err := validate.DecodeAndValidate(r, &input); err != nil {
		response.AppError(w, err)
		return
	}
	post, err := h.svc.CreatePost(r.Context(), userID, &input)
	if err != nil {
		response.AppError(w, err)
		return
	}
	response.Created(w, post)
}

func (h *SocialHubHandler) GetPost(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "not authenticated")
		return
	}
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "invalid post ID")
		return
	}
	post, err := h.svc.GetPost(r.Context(), userID, id)
	if err != nil {
		response.AppError(w, err)
		return
	}
	response.OK(w, post)
}

func (h *SocialHubHandler) ListPosts(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "not authenticated")
		return
	}
	q := r.URL.Query()
	filter := repository.ScheduledPostFilter{
		DateFrom: q.Get("date_from"),
		DateTo:   q.Get("date_to"),
		Status:   q.Get("status"),
		Platform: q.Get("platform"),
	}
	posts, err := h.svc.ListPosts(r.Context(), userID, filter)
	if err != nil {
		response.AppError(w, err)
		return
	}
	response.OK(w, posts)
}

func (h *SocialHubHandler) UpdatePost(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "not authenticated")
		return
	}
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "invalid post ID")
		return
	}
	var input service.UpdateScheduledPostInput
	if err := validate.DecodeAndValidate(r, &input); err != nil {
		response.AppError(w, err)
		return
	}
	post, err := h.svc.UpdatePost(r.Context(), userID, id, &input)
	if err != nil {
		response.AppError(w, err)
		return
	}
	response.OK(w, post)
}

func (h *SocialHubHandler) DeletePost(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "not authenticated")
		return
	}
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "invalid post ID")
		return
	}
	if err := h.svc.DeletePost(r.Context(), userID, id); err != nil {
		response.AppError(w, err)
		return
	}
	response.NoContent(w)
}

func (h *SocialHubHandler) DuplicatePost(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "not authenticated")
		return
	}
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "invalid post ID")
		return
	}
	post, err := h.svc.DuplicatePost(r.Context(), userID, id)
	if err != nil {
		response.AppError(w, err)
		return
	}
	response.Created(w, post)
}

func (h *SocialHubHandler) GetQueue(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "not authenticated")
		return
	}
	queue, err := h.svc.GetQueue(r.Context(), userID)
	if err != nil {
		response.AppError(w, err)
		return
	}
	response.OK(w, queue)
}

func (h *SocialHubHandler) RetryPost(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "not authenticated")
		return
	}
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "invalid post ID")
		return
	}
	post, err := h.svc.RetryPost(r.Context(), userID, id)
	if err != nil {
		response.AppError(w, err)
		return
	}
	response.OK(w, post)
}

func (h *SocialHubHandler) ClearCompleted(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "not authenticated")
		return
	}
	count, err := h.svc.ClearCompleted(r.Context(), userID)
	if err != nil {
		response.AppError(w, err)
		return
	}
	response.OK(w, map[string]int64{"deleted": count})
}

// ═══════════════════════════════════════════════════════════════
//  Campaigns
// ═══════════════════════════════════════════════════════════════

func (h *SocialHubHandler) CreateCampaign(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "not authenticated")
		return
	}
	var input service.CreateCampaignInput
	if err := validate.DecodeAndValidate(r, &input); err != nil {
		response.AppError(w, err)
		return
	}
	campaign, err := h.svc.CreateCampaign(r.Context(), userID, &input)
	if err != nil {
		response.AppError(w, err)
		return
	}
	response.Created(w, campaign)
}

func (h *SocialHubHandler) GetCampaign(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "not authenticated")
		return
	}
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "invalid campaign ID")
		return
	}
	campaign, err := h.svc.GetCampaign(r.Context(), userID, id)
	if err != nil {
		response.AppError(w, err)
		return
	}
	response.OK(w, campaign)
}

func (h *SocialHubHandler) ListCampaigns(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "not authenticated")
		return
	}
	campaigns, err := h.svc.ListCampaigns(r.Context(), userID)
	if err != nil {
		response.AppError(w, err)
		return
	}
	response.OK(w, campaigns)
}

func (h *SocialHubHandler) UpdateCampaign(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "not authenticated")
		return
	}
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "invalid campaign ID")
		return
	}
	var input service.UpdateCampaignInput
	if err := validate.DecodeAndValidate(r, &input); err != nil {
		response.AppError(w, err)
		return
	}
	campaign, err := h.svc.UpdateCampaign(r.Context(), userID, id, &input)
	if err != nil {
		response.AppError(w, err)
		return
	}
	response.OK(w, campaign)
}

func (h *SocialHubHandler) DeleteCampaign(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "not authenticated")
		return
	}
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "invalid campaign ID")
		return
	}
	if err := h.svc.DeleteCampaign(r.Context(), userID, id); err != nil {
		response.AppError(w, err)
		return
	}
	response.NoContent(w)
}

// ═══════════════════════════════════════════════════════════════
//  Workflows
// ═══════════════════════════════════════════════════════════════

func (h *SocialHubHandler) CreateWorkflow(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "not authenticated")
		return
	}
	var input service.CreateWorkflowInput
	if err := validate.DecodeAndValidate(r, &input); err != nil {
		response.AppError(w, err)
		return
	}
	wf, err := h.svc.CreateWorkflow(r.Context(), userID, &input)
	if err != nil {
		response.AppError(w, err)
		return
	}
	response.Created(w, wf)
}

func (h *SocialHubHandler) GetWorkflow(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "not authenticated")
		return
	}
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "invalid workflow ID")
		return
	}
	wf, err := h.svc.GetWorkflow(r.Context(), userID, id)
	if err != nil {
		response.AppError(w, err)
		return
	}
	response.OK(w, wf)
}

func (h *SocialHubHandler) ListWorkflows(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "not authenticated")
		return
	}
	workflows, err := h.svc.ListWorkflows(r.Context(), userID)
	if err != nil {
		response.AppError(w, err)
		return
	}
	response.OK(w, workflows)
}

func (h *SocialHubHandler) ListPublicWorkflows(w http.ResponseWriter, r *http.Request) {
	workflows, err := h.svc.ListPublicWorkflows(r.Context())
	if err != nil {
		response.AppError(w, err)
		return
	}
	response.OK(w, workflows)
}

func (h *SocialHubHandler) UpdateWorkflow(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "not authenticated")
		return
	}
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "invalid workflow ID")
		return
	}
	var input service.UpdateWorkflowInput
	if err := validate.DecodeAndValidate(r, &input); err != nil {
		response.AppError(w, err)
		return
	}
	wf, err := h.svc.UpdateWorkflow(r.Context(), userID, id, &input)
	if err != nil {
		response.AppError(w, err)
		return
	}
	response.OK(w, wf)
}

func (h *SocialHubHandler) DeleteWorkflow(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "not authenticated")
		return
	}
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "invalid workflow ID")
		return
	}
	if err := h.svc.DeleteWorkflow(r.Context(), userID, id); err != nil {
		response.AppError(w, err)
		return
	}
	response.NoContent(w)
}

// ═══════════════════════════════════════════════════════════════
//  Stats
// ═══════════════════════════════════════════════════════════════

func (h *SocialHubHandler) GetStats(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "not authenticated")
		return
	}
	stats, err := h.svc.GetStats(r.Context(), userID)
	if err != nil {
		response.AppError(w, err)
		return
	}
	response.OK(w, stats)
}
