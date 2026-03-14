package handler

import (
	"encoding/json"
	"io"
	"log/slog"
	"net/http"

	"github.com/art-haven-hub/backend/internal/pkg/response"
	"github.com/art-haven-hub/backend/internal/service"
	"github.com/stripe/stripe-go/v81"
	"github.com/stripe/stripe-go/v81/webhook"
)

type WebhookHandler struct {
	orderService  *service.OrderService
	webhookSecret string
}

func NewWebhookHandler(orderService *service.OrderService, webhookSecret string) *WebhookHandler {
	return &WebhookHandler{
		orderService:  orderService,
		webhookSecret: webhookSecret,
	}
}

func (h *WebhookHandler) StripeWebhook(w http.ResponseWriter, r *http.Request) {
	body, err := io.ReadAll(io.LimitReader(r.Body, 65536))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "cannot read body")
		return
	}

	event, err := webhook.ConstructEvent(body, r.Header.Get("Stripe-Signature"), h.webhookSecret)
	if err != nil {
		slog.Error("stripe webhook signature verification failed", "error", err)
		response.Error(w, http.StatusBadRequest, "invalid signature")
		return
	}

	switch event.Type {
	case "checkout.session.completed":
		var sess stripe.CheckoutSession
		if err := json.Unmarshal(event.Data.Raw, &sess); err != nil {
			slog.Error("failed to unmarshal checkout session", "error", err)
			response.Error(w, http.StatusBadRequest, "invalid event data")
			return
		}

		if err := h.orderService.HandleCheckoutCompleted(r.Context(), sess.ID, sess.PaymentIntent.ID); err != nil {
			slog.Error("failed to handle checkout completed", "error", err, "session_id", sess.ID)
			response.Error(w, http.StatusInternalServerError, "processing failed")
			return
		}

		slog.Info("checkout completed", "session_id", sess.ID)

	default:
		slog.Debug("unhandled stripe event", "type", event.Type)
	}

	w.WriteHeader(http.StatusOK)
}
