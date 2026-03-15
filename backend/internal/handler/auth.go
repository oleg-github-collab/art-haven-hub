package handler

import (
	"net/http"

	"github.com/art-haven-hub/backend/internal/middleware"
	"github.com/art-haven-hub/backend/internal/pkg/response"
	"github.com/art-haven-hub/backend/internal/pkg/validate"
	"github.com/art-haven-hub/backend/internal/service"
)

type AuthHandler struct {
	authService *service.AuthService
}

func NewAuthHandler(authService *service.AuthService) *AuthHandler {
	return &AuthHandler{authService: authService}
}

func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var input service.RegisterInput
	if err := validate.DecodeAndValidate(r, &input); err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	result, err := h.authService.Register(r.Context(), &input)
	if err != nil {
		response.AppError(w, err)
		return
	}

	response.Created(w, result)
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var input service.LoginInput
	if err := validate.DecodeAndValidate(r, &input); err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	result, err := h.authService.Login(r.Context(), &input)
	if err != nil {
		response.AppError(w, err)
		return
	}

	response.OK(w, result)
}

func (h *AuthHandler) Refresh(w http.ResponseWriter, r *http.Request) {
	var input service.RefreshInput
	if err := validate.DecodeAndValidate(r, &input); err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	result, err := h.authService.Refresh(r.Context(), &input)
	if err != nil {
		response.AppError(w, err)
		return
	}

	response.OK(w, result)
}

func (h *AuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
	var input service.RefreshInput
	if err := validate.DecodeAndValidate(r, &input); err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	if err := h.authService.Logout(r.Context(), input.RefreshToken); err != nil {
		response.AppError(w, err)
		return
	}

	response.NoContent(w)
}

func (h *AuthHandler) GoogleLogin(w http.ResponseWriter, r *http.Request) {
	var input service.GoogleLoginInput
	if err := validate.DecodeAndValidate(r, &input); err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	result, err := h.authService.GoogleLogin(r.Context(), &input)
	if err != nil {
		response.AppError(w, err)
		return
	}

	response.OK(w, result)
}

func (h *AuthHandler) Me(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	user, err := h.authService.GetCurrentUser(r.Context(), userID)
	if err != nil {
		response.AppError(w, err)
		return
	}

	response.OK(w, user)
}
