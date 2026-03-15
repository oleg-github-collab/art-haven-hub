package handler

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"github.com/art-haven-hub/backend/internal/middleware"
	"github.com/art-haven-hub/backend/internal/pkg/response"
	"github.com/art-haven-hub/backend/internal/pkg/validate"
	"github.com/art-haven-hub/backend/internal/repository"
	"github.com/art-haven-hub/backend/internal/service"
)

type ArtworkHandler struct {
	artworkService *service.ArtworkService
}

func NewArtworkHandler(artworkService *service.ArtworkService) *ArtworkHandler {
	return &ArtworkHandler{artworkService: artworkService}
}

func (h *ArtworkHandler) Create(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	var input service.CreateArtworkInput
	if err := validate.DecodeAndValidate(r, &input); err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	artwork, err := h.artworkService.Create(r.Context(), userID, &input)
	if err != nil {
		response.AppError(w, err)
		return
	}

	response.Created(w, artwork)
}

func (h *ArtworkHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "invalid artwork ID")
		return
	}

	var viewerID *uuid.UUID
	if uid, ok := middleware.GetUserID(r.Context()); ok {
		viewerID = &uid
	}

	artwork, err := h.artworkService.GetByID(r.Context(), id, viewerID)
	if err != nil {
		response.AppError(w, err)
		return
	}

	response.OK(w, artwork)
}

func (h *ArtworkHandler) Update(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "invalid artwork ID")
		return
	}

	var input service.UpdateArtworkInput
	if err := validate.DecodeAndValidate(r, &input); err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	artwork, err := h.artworkService.Update(r.Context(), id, userID, &input)
	if err != nil {
		response.AppError(w, err)
		return
	}

	response.OK(w, artwork)
}

func (h *ArtworkHandler) Delete(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "invalid artwork ID")
		return
	}

	if err := h.artworkService.Delete(r.Context(), id, userID); err != nil {
		response.AppError(w, err)
		return
	}

	response.NoContent(w)
}

func (h *ArtworkHandler) List(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()

	filter := repository.ArtworkFilter{
		Category:  q.Get("category"),
		Condition: q.Get("condition"),
		Country:   q.Get("country"),
		City:      q.Get("city"),
		Search:    q.Get("search"),
		Sort:      q.Get("sort"),
		Cursor:    q.Get("cursor"),
		Status:    q.Get("status"),
	}

	if v := q.Get("min_price"); v != "" {
		if p, err := strconv.ParseInt(v, 10, 64); err == nil {
			filter.MinPrice = &p
		}
	}
	if v := q.Get("max_price"); v != "" {
		if p, err := strconv.ParseInt(v, 10, 64); err == nil {
			filter.MaxPrice = &p
		}
	}
	if v := q.Get("artist_id"); v != "" {
		if id, err := uuid.Parse(v); err == nil {
			filter.ArtistID = &id
		}
	}
	if v := q.Get("tags"); v != "" {
		filter.Tags = strings.Split(v, ",")
	}
	if v := q.Get("limit"); v != "" {
		if l, err := strconv.Atoi(v); err == nil {
			filter.Limit = l
		}
	}

	result, err := h.artworkService.List(r.Context(), filter)
	if err != nil {
		response.AppError(w, err)
		return
	}

	response.OK(w, result)
}

func (h *ArtworkHandler) GetCategories(w http.ResponseWriter, r *http.Request) {
	cats, err := h.artworkService.GetCategories(r.Context())
	if err != nil {
		response.AppError(w, err)
		return
	}

	response.OK(w, cats)
}

// --- Reviews ---

func (h *ArtworkHandler) CreateReview(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	artworkID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "invalid artwork ID")
		return
	}

	var input service.CreateReviewInput
	if err := validate.DecodeAndValidate(r, &input); err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	review, err := h.artworkService.CreateReview(r.Context(), artworkID, userID, &input)
	if err != nil {
		response.AppError(w, err)
		return
	}

	response.Created(w, review)
}

func (h *ArtworkHandler) GetReviews(w http.ResponseWriter, r *http.Request) {
	artworkID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "invalid artwork ID")
		return
	}

	limit, offset := parsePagination(r)

	reviews, err := h.artworkService.GetReviews(r.Context(), artworkID, limit, offset)
	if err != nil {
		response.AppError(w, err)
		return
	}

	response.OK(w, reviews)
}

// --- Favorites ---

func (h *ArtworkHandler) AddFavorite(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	artworkID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "invalid artwork ID")
		return
	}

	if err := h.artworkService.AddFavorite(r.Context(), userID, artworkID); err != nil {
		response.AppError(w, err)
		return
	}

	response.NoContent(w)
}

func (h *ArtworkHandler) RemoveFavorite(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	artworkID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "invalid artwork ID")
		return
	}

	if err := h.artworkService.RemoveFavorite(r.Context(), userID, artworkID); err != nil {
		response.AppError(w, err)
		return
	}

	response.NoContent(w)
}

func (h *ArtworkHandler) GetFavorites(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	limit, offset := parsePagination(r)

	artworks, err := h.artworkService.GetUserFavorites(r.Context(), userID, limit, offset)
	if err != nil {
		response.AppError(w, err)
		return
	}

	response.OK(w, artworks)
}
