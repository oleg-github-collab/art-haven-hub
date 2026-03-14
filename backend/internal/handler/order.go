package handler

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"github.com/art-haven-hub/backend/internal/middleware"
	"github.com/art-haven-hub/backend/internal/pkg/response"
	"github.com/art-haven-hub/backend/internal/service"
)

type OrderHandler struct {
	orderService *service.OrderService
}

func NewOrderHandler(orderService *service.OrderService) *OrderHandler {
	return &OrderHandler{orderService: orderService}
}

func (h *OrderHandler) GetOrders(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	limit, offset := parsePagination(r)
	orders, err := h.orderService.GetBuyerOrders(r.Context(), userID, limit, offset)
	if err != nil {
		response.AppError(w, err)
		return
	}

	response.OK(w, orders)
}

func (h *OrderHandler) GetOrder(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	orderID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "invalid order ID")
		return
	}

	order, err := h.orderService.GetOrder(r.Context(), orderID, userID)
	if err != nil {
		response.AppError(w, err)
		return
	}

	response.OK(w, order)
}

func (h *OrderHandler) GetSellerOrders(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	limit, offset := parsePagination(r)
	orders, err := h.orderService.GetSellerOrders(r.Context(), userID, limit, offset)
	if err != nil {
		response.AppError(w, err)
		return
	}

	response.OK(w, orders)
}
