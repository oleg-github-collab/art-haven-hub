package handler

import (
	"context"
	"encoding/json"
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
	callService      *service.CallService
	hub              *ws.Hub
	jwtManager       *jwt.Manager
}

func NewMessengerHandler(messengerService *service.MessengerService, callService *service.CallService, hub *ws.Hub, jwtManager *jwt.Manager) *MessengerHandler {
	return &MessengerHandler{
		messengerService: messengerService,
		callService:      callService,
		hub:              hub,
		jwtManager:       jwtManager,
	}
}

func (h *MessengerHandler) WebSocket(w http.ResponseWriter, r *http.Request) {
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
	client.SetOnMessage(h.handleCallSignaling)
	h.hub.Register(client)

	ctx := context.Background()
	go client.WritePump(ctx)
	client.ReadPump(ctx)
}

// handleCallSignaling dispatches WebRTC and call signaling messages.
func (h *MessengerHandler) handleCallSignaling(ctx context.Context, client *ws.Client, msg ws.WSMessage) {
	switch msg.Type {
	case "call_initiate":
		var p struct {
			CalleeID       uuid.UUID `json:"callee_id"`
			ConversationID uuid.UUID `json:"conversation_id"`
			CallType       string    `json:"call_type"`
		}
		if json.Unmarshal(msg.Payload, &p) != nil {
			return
		}
		if err := h.callService.InitiateCall(ctx, client.UserID, p.CalleeID, p.ConversationID, p.CallType); err != nil {
			slog.Debug("call_initiate error", "error", err, "user_id", client.UserID)
		}

	case "call_accept":
		var p struct {
			CallID uuid.UUID `json:"call_id"`
		}
		if json.Unmarshal(msg.Payload, &p) != nil {
			return
		}
		if err := h.callService.AcceptCall(ctx, p.CallID, client.UserID); err != nil {
			slog.Debug("call_accept error", "error", err, "user_id", client.UserID)
		}

	case "call_reject":
		var p struct {
			CallID uuid.UUID `json:"call_id"`
			Reason string    `json:"reason"`
		}
		if json.Unmarshal(msg.Payload, &p) != nil {
			return
		}
		if err := h.callService.RejectCall(ctx, p.CallID, client.UserID, p.Reason); err != nil {
			slog.Debug("call_reject error", "error", err, "user_id", client.UserID)
		}

	case "call_end":
		var p struct {
			CallID uuid.UUID `json:"call_id"`
		}
		if json.Unmarshal(msg.Payload, &p) != nil {
			return
		}
		if err := h.callService.EndCall(ctx, p.CallID, client.UserID); err != nil {
			slog.Debug("call_end error", "error", err, "user_id", client.UserID)
		}

	case "webrtc_offer", "webrtc_answer", "ice_candidate":
		var p struct {
			CallID uuid.UUID `json:"call_id"`
		}
		if json.Unmarshal(msg.Payload, &p) != nil {
			return
		}
		h.callService.RelaySignaling(client.UserID, p.CallID, msg.Type, msg.Payload)

	case "cobrowse_start", "cobrowse_navigate", "cobrowse_stop":
		var p struct {
			CallID uuid.UUID `json:"call_id"`
		}
		if json.Unmarshal(msg.Payload, &p) != nil {
			return
		}
		h.callService.RelayCoBrowse(client.UserID, p.CallID, msg.Type, msg.Payload)

	default:
		slog.Debug("ws unknown message type", "type", msg.Type, "user_id", client.UserID)
	}
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

// --- Reactions ---

func (h *MessengerHandler) ToggleReaction(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	msgID, err := uuid.Parse(chi.URLParam(r, "messageId"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "invalid message ID")
		return
	}

	var input struct {
		Emoji string `json:"emoji" validate:"required,max=10"`
	}
	if err := validate.DecodeAndValidate(r, &input); err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	toggled, err := h.messengerService.ToggleReaction(r.Context(), msgID, userID, input.Emoji)
	if err != nil {
		response.AppError(w, err)
		return
	}

	response.OK(w, map[string]bool{"added": toggled})
}

// --- Forward ---

func (h *MessengerHandler) ForwardMessage(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	msgID, err := uuid.Parse(chi.URLParam(r, "messageId"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "invalid message ID")
		return
	}

	var input struct {
		ConversationIDs []uuid.UUID `json:"conversation_ids" validate:"required,min=1,max=10"`
	}
	if err := validate.DecodeAndValidate(r, &input); err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	msgs, err := h.messengerService.ForwardMessage(r.Context(), msgID, userID, input.ConversationIDs)
	if err != nil {
		response.AppError(w, err)
		return
	}

	response.Created(w, msgs)
}

// --- Calls ---

func (h *MessengerHandler) GetCallHistory(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	limit, offset := parsePagination(r)
	calls, err := h.callService.GetCallHistory(r.Context(), userID, limit, offset)
	if err != nil {
		response.AppError(w, err)
		return
	}

	response.OK(w, calls)
}

func (h *MessengerHandler) GetConversationCallHistory(w http.ResponseWriter, r *http.Request) {
	userID, _ := middleware.GetUserID(r.Context())
	_ = userID

	convID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "invalid conversation ID")
		return
	}

	limit, offset := parsePagination(r)
	calls, err := h.callService.GetConversationCalls(r.Context(), convID, limit, offset)
	if err != nil {
		response.AppError(w, err)
		return
	}

	response.OK(w, calls)
}

func (h *MessengerHandler) GetICEServers(w http.ResponseWriter, r *http.Request) {
	response.OK(w, h.callService.GetICEServers())
}
