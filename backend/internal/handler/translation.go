package handler

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"github.com/art-haven-hub/backend/internal/middleware"
	"github.com/art-haven-hub/backend/internal/pkg/apperror"
	"github.com/art-haven-hub/backend/internal/pkg/response"
	"github.com/art-haven-hub/backend/internal/pkg/validate"
	"github.com/art-haven-hub/backend/internal/service"
)

type TranslationHandler struct {
	svc *service.TranslationService
}

func NewTranslationHandler(svc *service.TranslationService) *TranslationHandler {
	return &TranslationHandler{svc: svc}
}

type TranslateInput struct {
	ArtworkID      string `json:"artwork_id" validate:"required"`
	TargetLanguage string `json:"target_language" validate:"required,oneof=en uk de es fr"`
}

func (h *TranslationHandler) Translate(w http.ResponseWriter, r *http.Request) {
	_, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	var input TranslateInput
	if err := validate.DecodeAndValidate(r, &input); err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	artworkID, err := uuid.Parse(input.ArtworkID)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "invalid artwork_id")
		return
	}

	job, err := h.svc.Translate(r.Context(), artworkID, input.TargetLanguage)
	if err != nil {
		response.AppError(w, err)
		return
	}

	response.Created(w, job)
}

func (h *TranslationHandler) GetJob(w http.ResponseWriter, r *http.Request) {
	jobID, err := uuid.Parse(chi.URLParam(r, "jobId"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "invalid job ID")
		return
	}

	job := h.svc.GetJob(jobID)
	if job == nil {
		response.AppError(w, apperror.NotFound("translation job", jobID.String()))
		return
	}

	response.OK(w, job)
}
