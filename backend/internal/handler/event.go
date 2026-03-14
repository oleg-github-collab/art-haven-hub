package handler

import (
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"github.com/art-haven-hub/backend/internal/middleware"
	"github.com/art-haven-hub/backend/internal/model"
	"github.com/art-haven-hub/backend/internal/pkg/apperror"
	"github.com/art-haven-hub/backend/internal/pkg/response"
	"github.com/art-haven-hub/backend/internal/pkg/validate"
	"github.com/art-haven-hub/backend/internal/repository"
)

type EventHandler struct {
	repo *repository.EventRepo
}

func NewEventHandler(repo *repository.EventRepo) *EventHandler {
	return &EventHandler{repo: repo}
}

type CreateEventInput struct {
	Title        string   `json:"title" validate:"required,min=1,max=200"`
	Description  string   `json:"description" validate:"required,min=1,max=10000"`
	EventType    string   `json:"event_type" validate:"required,oneof=exhibition workshop meetup auction opening"`
	Location     *string  `json:"location"`
	Address      *string  `json:"address"`
	City         *string  `json:"city"`
	Country      *string  `json:"country"`
	IsOnline     bool     `json:"is_online"`
	OnlineURL    *string  `json:"online_url"`
	CoverImage   *string  `json:"cover_image"`
	Images       []string `json:"images"`
	StartsAt     string   `json:"starts_at" validate:"required"`
	EndsAt       *string  `json:"ends_at"`
	PriceCents   int64    `json:"price_cents" validate:"min=0"`
	Currency     string   `json:"currency" validate:"omitempty,oneof=EUR USD UAH"`
	MaxAttendees *int     `json:"max_attendees"`
	Tags         []string `json:"tags" validate:"omitempty,max=10"`
}

func (h *EventHandler) Create(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	var input CreateEventInput
	if err := validate.DecodeAndValidate(r, &input); err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	startsAt, err := time.Parse(time.RFC3339, input.StartsAt)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "invalid starts_at format")
		return
	}

	currency := input.Currency
	if currency == "" {
		currency = "EUR"
	}

	event := &model.Event{
		OrganizerID:  userID,
		Title:        input.Title,
		Description:  input.Description,
		EventType:    input.EventType,
		Location:     input.Location,
		Address:      input.Address,
		City:         input.City,
		Country:      input.Country,
		IsOnline:     input.IsOnline,
		OnlineURL:    input.OnlineURL,
		CoverImage:   input.CoverImage,
		Images:       model.StringArray(input.Images),
		StartsAt:     startsAt,
		PriceCents:   input.PriceCents,
		Currency:     currency,
		MaxAttendees: input.MaxAttendees,
		Tags:         model.StringArray(input.Tags),
	}

	if input.EndsAt != nil {
		endsAt, err := time.Parse(time.RFC3339, *input.EndsAt)
		if err == nil {
			event.EndsAt = &endsAt
		}
	}

	if err := h.repo.Create(r.Context(), event); err != nil {
		response.AppError(w, err)
		return
	}

	response.Created(w, event)
}

func (h *EventHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "invalid ID")
		return
	}

	event, err := h.repo.GetByID(r.Context(), id)
	if err != nil || event == nil {
		response.AppError(w, apperror.NotFound("event", id.String()))
		return
	}

	if uid, ok := middleware.GetUserID(r.Context()); ok {
		event.IsAttending, _ = h.repo.IsAttending(r.Context(), id, uid)
	}

	response.OK(w, event)
}

func (h *EventHandler) List(w http.ResponseWriter, r *http.Request) {
	limit, offset := parsePagination(r)
	events, err := h.repo.List(r.Context(), limit, offset)
	if err != nil {
		response.AppError(w, err)
		return
	}
	response.OK(w, events)
}

func (h *EventHandler) Delete(w http.ResponseWriter, r *http.Request) {
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

	event, err := h.repo.GetByID(r.Context(), id)
	if err != nil || event == nil {
		response.AppError(w, apperror.NotFound("event", id.String()))
		return
	}
	if event.OrganizerID != userID {
		response.AppError(w, apperror.Forbidden("not your event"))
		return
	}

	if err := h.repo.Delete(r.Context(), id); err != nil {
		response.AppError(w, err)
		return
	}

	response.NoContent(w)
}

func (h *EventHandler) Attend(w http.ResponseWriter, r *http.Request) {
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

	if err := h.repo.Attend(r.Context(), id, userID); err != nil {
		response.AppError(w, err)
		return
	}

	response.NoContent(w)
}

func (h *EventHandler) Unattend(w http.ResponseWriter, r *http.Request) {
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

	if err := h.repo.Unattend(r.Context(), id, userID); err != nil {
		response.AppError(w, err)
		return
	}

	response.NoContent(w)
}
