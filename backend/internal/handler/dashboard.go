package handler

import (
	"net/http"

	"github.com/art-haven-hub/backend/internal/middleware"
	"github.com/art-haven-hub/backend/internal/pkg/response"
	"github.com/art-haven-hub/backend/internal/repository"
)

type DashboardHandler struct {
	repo *repository.DashboardRepo
}

func NewDashboardHandler(repo *repository.DashboardRepo) *DashboardHandler {
	return &DashboardHandler{repo: repo}
}

func (h *DashboardHandler) GetStats(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	stats, err := h.repo.GetStats(r.Context(), userID)
	if err != nil {
		response.AppError(w, err)
		return
	}

	response.OK(w, stats)
}

func (h *DashboardHandler) GetArtworks(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	status := r.URL.Query().Get("status")
	limit, offset := parsePagination(r)

	artworks, err := h.repo.GetArtworks(r.Context(), userID, status, limit, offset)
	if err != nil {
		response.AppError(w, err)
		return
	}

	response.OK(w, artworks)
}

type AnalyticsResponse struct {
	Period string                    `json:"period"`
	Views  []repository.DataPoint   `json:"views"`
	Sales  []repository.DataPoint   `json:"sales"`
}

func (h *DashboardHandler) GetAnalytics(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	period := r.URL.Query().Get("period")
	if period == "" {
		period = "month"
	}

	views, err := h.repo.GetViewsAnalytics(r.Context(), userID, period)
	if err != nil {
		response.AppError(w, err)
		return
	}

	sales, err := h.repo.GetSalesAnalytics(r.Context(), userID, period)
	if err != nil {
		response.AppError(w, err)
		return
	}

	response.OK(w, AnalyticsResponse{
		Period: period,
		Views:  views,
		Sales:  sales,
	})
}

func (h *DashboardHandler) GetOrders(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	limit, offset := parsePagination(r)

	orders, err := h.repo.GetSellerOrders(r.Context(), userID, limit, offset)
	if err != nil {
		response.AppError(w, err)
		return
	}

	response.OK(w, orders)
}
