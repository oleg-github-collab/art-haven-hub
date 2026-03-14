package handler

import (
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"github.com/art-haven-hub/backend/internal/middleware"
	"github.com/art-haven-hub/backend/internal/pkg/apperror"
	"github.com/art-haven-hub/backend/internal/pkg/response"
	"github.com/art-haven-hub/backend/internal/repository"
	"github.com/art-haven-hub/backend/internal/service"
)

type SearchHandler struct {
	searchRepo   *repository.SearchRepo
	embeddingSvc *service.EmbeddingService
}

func NewSearchHandler(searchRepo *repository.SearchRepo, embeddingSvc *service.EmbeddingService) *SearchHandler {
	return &SearchHandler{
		searchRepo:   searchRepo,
		embeddingSvc: embeddingSvc,
	}
}

func (h *SearchHandler) Search(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query().Get("q")
	if query == "" {
		response.Error(w, http.StatusBadRequest, "query parameter 'q' is required")
		return
	}

	limit := 20
	if l := r.URL.Query().Get("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 && parsed <= 50 {
			limit = parsed
		}
	}

	var embeddingStr string
	if h.embeddingSvc.IsConfigured() {
		embedding, err := h.embeddingSvc.Generate(r.Context(), query)
		if err == nil {
			embeddingStr = h.embeddingSvc.FormatVector(embedding)
		}
	}

	results, err := h.searchRepo.HybridSearch(r.Context(), query, embeddingStr, limit)
	if err != nil {
		response.AppError(w, err)
		return
	}

	response.OK(w, results)
}

func (h *SearchHandler) SimilarArtworks(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "invalid ID")
		return
	}

	artworks, err := h.searchRepo.SimilarArtworks(r.Context(), id, 8)
	if err != nil {
		response.AppError(w, err)
		return
	}

	response.OK(w, artworks)
}

func (h *SearchHandler) Recommendations(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	limit := 24
	if l := r.URL.Query().Get("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 && parsed <= 50 {
			limit = parsed
		}
	}

	artworks, err := h.searchRepo.Recommendations(r.Context(), userID, limit)
	if err != nil {
		response.AppError(w, err)
		return
	}

	response.OK(w, artworks)
}

func (h *SearchHandler) BoardMatches(w http.ResponseWriter, r *http.Request) {
	_, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "invalid ID")
		return
	}

	matches, err := h.searchRepo.BoardMatches(r.Context(), id, 5)
	if err != nil {
		response.AppError(w, apperror.NotFound("announcement", id.String()))
		return
	}

	response.OK(w, matches)
}
