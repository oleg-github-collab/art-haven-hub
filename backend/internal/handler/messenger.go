package handler

import (
	"context"
	"log/slog"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"nhooyr.io/websocket"

	"github.com/art-haven-hub/backend/internal/middleware"
	"github.com/art-haven-hub/backend/internal/pkg/jwt"
	"github.com/art-haven-hub/backend/internal/pkg/response"
	"github.com/art-haven-hub/backend/internal/pkg/validate"
	"github.com/art-haven-hub/backend/internal/service"
	"github.com/art-haven-hub/backend/internal/ws"
)

type MessengerHandler struct {
	messengerService *service.MessengerService
	hub              *ws.Hub
	jwtManager       *jwt.Manager
}

func NewMessengerHandler(messengerService *service.MessengerService, hub *ws.Hub, jwtManager *jwt.Manager) *MessengerHandler {
	return &MessengerHandler{
		messengerService: messengerService,
		hub:              hub,
		jwtManager:       jwtManager,
	}
}

func (h *MessengerHandler) WebSocket(w http.ResponseWriter, r *http.Request) {
	// Authenticate via query param token
	token := r.URL.Query().Get("token")
	if token == "" {
		response.Error(w, http.StatusUnauthorized, "token required")
		return
	}

	claims, err := h.jwtManager.ValidateAccessToken(token)
	if err != nil {
		response.Error(w, http.StatusUnauthorized, "invalid token")
		return
	}

	conn, err := websocket.Accept(w, r, &websocket.AcceptOptions{
		OriginPatterns: []string{"*"},
	})
	if err != nil {
		slog.Error("ws accept error", "error", err)
		return
	}

	client := ws.NewClient(claims.UserID, conn, h.hub)
	h.hub.Register(client)

	ctx := context.Background()
	go client.WritePump(ctx)
	client.ReadPump(ctx)
}

func (h *MessengerHandler) CreateConversation(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	var input service.CreateConversationInput
	if err := validate.DecodeAndValidate(r, &input); err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	conv, err := h.messengerService.CreateConversation(r.Context(), userID, &input)
	if err != nil {
		response.AppError(w, err)
		return
	}

	response.Created(w, conv)
}

func (h *MessengerHandler) GetConversations(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	convs, err := h.messengerService.GetConversations(r.Context(), userID)
	if err != nil {
		response.AppError(w, err)
		return
	}

	response.OK(w, convs)
}

func (h *MessengerHandler) GetConversation(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	convID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "invalid conversation ID")
		return
	}

	conv, err := h.messengerService.GetConversation(r.Context(), convID, userID)
	if err != nil {
		response.AppError(w, err)
		return
	}

	response.OK(w, conv)
}

func (h *MessengerHandler) GetMessages(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	convID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "invalid conversation ID")
		return
	}

	limit, offset := parsePagination(r)
	msgs, err := h.messengerService.GetMessages(r.Context(), convID, userID, limit, offset)
	if err != nil {
		response.AppError(w, err)
		return
	}

	response.OK(w, msgs)
}

func (h *MessengerHandler) SendMessage(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	convID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "invalid conversation ID")
		return
	}

	var input service.SendMessageInput
	if err := validate.DecodeAndValidate(r, &input); err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	msg, err := h.messengerService.SendMessage(r.Context(), convID, userID, &input)
	if err != nil {
		response.AppError(w, err)
		return
	}

	response.Created(w, msg)
}

func (h *MessengerHandler) MarkRead(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	convID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "invalid conversation ID")
		return
	}

	if err := h.messengerService.MarkRead(r.Context(), convID, userID); err != nil {
		response.AppError(w, err)
		return
	}

	response.NoContent(w)
}

func (h *MessengerHandler) PinConversation(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	convID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "invalid conversation ID")
		return
	}

	if err := h.messengerService.UpdatePin(r.Context(), convID, userID, true); err != nil {
		response.AppError(w, err)
		return
	}

	response.NoContent(w)
}

func (h *MessengerHandler) MuteConversation(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	convID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "invalid conversation ID")
		return
	}

	if err := h.messengerService.UpdateMute(r.Context(), convID, userID, true); err != nil {
		response.AppError(w, err)
		return
	}

	response.NoContent(w)
}
