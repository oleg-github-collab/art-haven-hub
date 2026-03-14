package handler

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"github.com/art-haven-hub/backend/internal/middleware"
	"github.com/art-haven-hub/backend/internal/model"
	"github.com/art-haven-hub/backend/internal/pkg/apperror"
	"github.com/art-haven-hub/backend/internal/pkg/response"
	"github.com/art-haven-hub/backend/internal/pkg/validate"
	"github.com/art-haven-hub/backend/internal/repository"
)

type BoardHandler struct {
	repo *repository.BoardRepo
}

func NewBoardHandler(repo *repository.BoardRepo) *BoardHandler {
	return &BoardHandler{repo: repo}
}

type CreateAnnouncementInput struct {
	Type        string   `json:"type" validate:"required,oneof=offer seek"`
	Title       string   `json:"title" validate:"required,min=1,max=200"`
	Description string   `json:"description" validate:"required,min=1,max=5000"`
	Category    *string  `json:"category"`
	Location    *string  `json:"location"`
	Budget      *string  `json:"budget"`
	Images      []string `json:"images"`
	Tags        []string `json:"tags" validate:"omitempty,max=10"`
}

func (h *BoardHandler) Create(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	var input CreateAnnouncementInput
	if err := validate.DecodeAndValidate(r, &input); err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	ann := &model.Announcement{
		AuthorID:    userID,
		Type:        input.Type,
		Title:       input.Title,
		Description: input.Description,
		Category:    input.Category,
		Location:    input.Location,
		Budget:      input.Budget,
		Images:      model.StringArray(input.Images),
		Tags:        model.StringArray(input.Tags),
		IsActive:    true,
	}

	if err := h.repo.CreateAnnouncement(r.Context(), ann); err != nil {
		response.AppError(w, err)
		return
	}

	response.Created(w, ann)
}

func (h *BoardHandler) List(w http.ResponseWriter, r *http.Request) {
	annType := r.URL.Query().Get("type")
	limit, offset := parsePagination(r)

	anns, err := h.repo.ListAnnouncements(r.Context(), annType, limit, offset)
	if err != nil {
		response.AppError(w, err)
		return
	}

	for i := range anns {
		author, _ := h.repo.GetAuthor(r.Context(), anns[i].AuthorID)
		anns[i].Author = author
	}

	response.OK(w, anns)
}

func (h *BoardHandler) Update(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "invalid ID")
		return
	}

	ann, err := h.repo.GetAnnouncement(r.Context(), id)
	if err != nil || ann == nil {
		response.AppError(w, apperror.NotFound("announcement", id.String()))
		return
	}
	if ann.AuthorID != userID {
		response.AppError(w, apperror.Forbidden("not your announcement"))
		return
	}

	var input CreateAnnouncementInput
	if err := validate.DecodeAndValidate(r, &input); err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	ann.Title = input.Title
	ann.Description = input.Description
	ann.Category = input.Category
	ann.Location = input.Location
	ann.Budget = input.Budget
	ann.Images = model.StringArray(input.Images)
	ann.Tags = model.StringArray(input.Tags)

	if err := h.repo.UpdateAnnouncement(r.Context(), ann); err != nil {
		response.AppError(w, err)
		return
	}

	response.OK(w, ann)
}

func (h *BoardHandler) Delete(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "invalid ID")
		return
	}

	ann, err := h.repo.GetAnnouncement(r.Context(), id)
	if err != nil || ann == nil {
		response.AppError(w, apperror.NotFound("announcement", id.String()))
		return
	}
	if ann.AuthorID != userID {
		response.AppError(w, apperror.Forbidden("not your announcement"))
		return
	}

	if err := h.repo.DeleteAnnouncement(r.Context(), id); err != nil {
		response.AppError(w, err)
		return
	}

	response.NoContent(w)
}
