package handler

import (
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"github.com/art-haven-hub/backend/internal/middleware"
	"github.com/art-haven-hub/backend/internal/pkg/response"
	"github.com/art-haven-hub/backend/internal/pkg/validate"
	"github.com/art-haven-hub/backend/internal/service"
)

type UserHandler struct {
	userService *service.UserService
}

func NewUserHandler(userService *service.UserService) *UserHandler {
	return &UserHandler{userService: userService}
}

func (h *UserHandler) GetProfile(w http.ResponseWriter, r *http.Request) {
	handle := chi.URLParam(r, "handle")
	if handle == "" {
		response.Error(w, http.StatusBadRequest, "handle is required")
		return
	}

	var viewerID *uuid.UUID
	if id, ok := middleware.GetUserID(r.Context()); ok {
		viewerID = &id
	}

	user, err := h.userService.GetProfile(r.Context(), handle, viewerID)
	if err != nil {
		response.AppError(w, err)
		return
	}

	response.OK(w, user)
}

func (h *UserHandler) UpdateProfile(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	var input service.UpdateProfileInput
	if err := validate.DecodeAndValidate(r, &input); err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	user, err := h.userService.UpdateProfile(r.Context(), userID, &input)
	if err != nil {
		response.AppError(w, err)
		return
	}

	response.OK(w, user)
}

func (h *UserHandler) UploadAvatar(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	r.Body = http.MaxBytesReader(w, r.Body, 10<<20) // 10MB
	if err := r.ParseMultipartForm(10 << 20); err != nil {
		response.Error(w, http.StatusBadRequest, "file too large or invalid multipart form")
		return
	}

	file, header, err := r.FormFile("avatar")
	if err != nil {
		response.Error(w, http.StatusBadRequest, "avatar file is required")
		return
	}
	defer file.Close()

	avatarURL, err := h.userService.UploadAvatar(r.Context(), userID, file, header)
	if err != nil {
		response.AppError(w, err)
		return
	}

	response.OK(w, map[string]string{"avatar_url": avatarURL})
}

func (h *UserHandler) Follow(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	targetID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "invalid user ID")
		return
	}

	if err := h.userService.Follow(r.Context(), userID, targetID); err != nil {
		response.AppError(w, err)
		return
	}

	response.NoContent(w)
}

func (h *UserHandler) Unfollow(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	targetID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "invalid user ID")
		return
	}

	if err := h.userService.Unfollow(r.Context(), userID, targetID); err != nil {
		response.AppError(w, err)
		return
	}

	response.NoContent(w)
}

func (h *UserHandler) GetFollowers(w http.ResponseWriter, r *http.Request) {
	targetID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "invalid user ID")
		return
	}

	limit, offset := parsePagination(r)

	users, err := h.userService.GetFollowers(r.Context(), targetID, limit, offset)
	if err != nil {
		response.AppError(w, err)
		return
	}

	response.OK(w, users)
}

func (h *UserHandler) GetFollowing(w http.ResponseWriter, r *http.Request) {
	targetID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "invalid user ID")
		return
	}

	limit, offset := parsePagination(r)

	users, err := h.userService.GetFollowing(r.Context(), targetID, limit, offset)
	if err != nil {
		response.AppError(w, err)
		return
	}

	response.OK(w, users)
}

func (h *UserHandler) ListArtists(w http.ResponseWriter, r *http.Request) {
	search := r.URL.Query().Get("search")
	city := r.URL.Query().Get("city")
	tag := r.URL.Query().Get("tag")
	limit, offset := parsePagination(r)

	result, err := h.userService.ListArtists(r.Context(), search, city, tag, limit, offset)
	if err != nil {
		response.AppError(w, err)
		return
	}

	response.OK(w, result)
}

func parsePagination(r *http.Request) (int, int) {
	limit := 20
	offset := 0

	if l, err := strconv.Atoi(r.URL.Query().Get("limit")); err == nil && l > 0 && l <= 100 {
		limit = l
	}
	if o, err := strconv.Atoi(r.URL.Query().Get("offset")); err == nil && o >= 0 {
		offset = o
	}

	return limit, offset
}
