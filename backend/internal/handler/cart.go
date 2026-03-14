package handler

import (
	"net/http"

	"github.com/google/uuid"

	"github.com/art-haven-hub/backend/internal/middleware"
	"github.com/art-haven-hub/backend/internal/pkg/response"
	"github.com/art-haven-hub/backend/internal/pkg/validate"
	"github.com/art-haven-hub/backend/internal/service"
)

type CartHandler struct {
	cartService  *service.CartService
	orderService *service.OrderService
}

func NewCartHandler(cartService *service.CartService, orderService *service.OrderService) *CartHandler {
	return &CartHandler{cartService: cartService, orderService: orderService}
}

func (h *CartHandler) GetCart(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	items, err := h.cartService.GetCart(r.Context(), userID)
	if err != nil {
		response.AppError(w, err)
		return
	}

	response.OK(w, items)
}

func (h *CartHandler) AddItem(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	var input service.CartItemInput
	if err := validate.DecodeAndValidate(r, &input); err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	if err := h.cartService.AddItem(r.Context(), userID, &input); err != nil {
		response.AppError(w, err)
		return
	}

	response.NoContent(w)
}

func (h *CartHandler) UpdateItem(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	var input service.CartItemInput
	if err := validate.DecodeAndValidate(r, &input); err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	if err := h.cartService.UpdateItem(r.Context(), userID, &input); err != nil {
		response.AppError(w, err)
		return
	}

	response.NoContent(w)
}

func (h *CartHandler) RemoveItem(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	artworkID, err := uuid.Parse(r.URL.Query().Get("artwork_id"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "invalid artwork_id")
		return
	}

	if err := h.cartService.RemoveItem(r.Context(), userID, artworkID); err != nil {
		response.AppError(w, err)
		return
	}

	response.NoContent(w)
}

func (h *CartHandler) ClearCart(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	if err := h.cartService.Clear(r.Context(), userID); err != nil {
		response.AppError(w, err)
		return
	}

	response.NoContent(w)
}

func (h *CartHandler) SyncCart(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	var input service.CartSyncInput
	if err := validate.DecodeAndValidate(r, &input); err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	if err := h.cartService.Sync(r.Context(), userID, &input); err != nil {
		response.AppError(w, err)
		return
	}

	response.NoContent(w)
}

func (h *CartHandler) Checkout(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	var input service.CheckoutInput
	if err := validate.DecodeAndValidate(r, &input); err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	result, err := h.orderService.CreateCheckoutSession(r.Context(), userID, &input)
	if err != nil {
		response.AppError(w, err)
		return
	}

	response.OK(w, result)
}
