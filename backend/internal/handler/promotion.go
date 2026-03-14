package handler

import (
	"fmt"
	"net/http"

	"github.com/google/uuid"
	stripe "github.com/stripe/stripe-go/v81"
	"github.com/stripe/stripe-go/v81/checkout/session"

	"github.com/art-haven-hub/backend/internal/middleware"
	"github.com/art-haven-hub/backend/internal/model"
	"github.com/art-haven-hub/backend/internal/pkg/response"
	"github.com/art-haven-hub/backend/internal/pkg/validate"
	"github.com/art-haven-hub/backend/internal/repository"
)

var promotionPricing = []model.PromotionPricing{
	{Days: 1, Price: 200},
	{Days: 3, Price: 500},
	{Days: 7, Price: 1000},
	{Days: 30, Price: 3000},
}

type PromotionHandler struct {
	repo       *repository.PromotionRepo
	successURL string
	cancelURL  string
}

func NewPromotionHandler(repo *repository.PromotionRepo, successURL, cancelURL string) *PromotionHandler {
	return &PromotionHandler{
		repo:       repo,
		successURL: successURL,
		cancelURL:  cancelURL,
	}
}

func (h *PromotionHandler) GetPricing(w http.ResponseWriter, r *http.Request) {
	response.OK(w, promotionPricing)
}

type PromoteInput struct {
	ArtworkID string `json:"artwork_id" validate:"required"`
	Days      int    `json:"days" validate:"required,oneof=1 3 7 30"`
}

func (h *PromotionHandler) Create(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	var input PromoteInput
	if err := validate.DecodeAndValidate(r, &input); err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	artworkID, err := uuid.Parse(input.ArtworkID)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "invalid artwork_id")
		return
	}

	var priceCents int64
	for _, p := range promotionPricing {
		if p.Days == input.Days {
			priceCents = p.Price
			break
		}
	}

	params := &stripe.CheckoutSessionParams{
		Mode: stripe.String(string(stripe.CheckoutSessionModePayment)),
		LineItems: []*stripe.CheckoutSessionLineItemParams{
			{
				PriceData: &stripe.CheckoutSessionLineItemPriceDataParams{
					Currency: stripe.String("eur"),
					ProductData: &stripe.CheckoutSessionLineItemPriceDataProductDataParams{
						Name: stripe.String(fmt.Sprintf("Artwork Promotion - %d days", input.Days)),
					},
					UnitAmount: stripe.Int64(priceCents),
				},
				Quantity: stripe.Int64(1),
			},
		},
		SuccessURL: stripe.String(h.successURL),
		CancelURL:  stripe.String(h.cancelURL),
		Metadata: map[string]string{
			"type":       "promotion",
			"artwork_id": artworkID.String(),
			"user_id":    userID.String(),
			"days":       fmt.Sprintf("%d", input.Days),
		},
	}

	sess, err := session.New(params)
	if err != nil {
		response.AppError(w, fmt.Errorf("creating stripe session: %w", err))
		return
	}

	promo := &model.Promotion{
		ArtworkID:       artworkID,
		UserID:          userID,
		DurationDays:    input.Days,
		PriceCents:      priceCents,
		Currency:        "EUR",
		StripeSessionID: &sess.ID,
		Status:          "pending",
	}

	if err := h.repo.Create(r.Context(), promo); err != nil {
		response.AppError(w, err)
		return
	}

	response.Created(w, map[string]string{
		"session_id":  sess.ID,
		"checkout_url": sess.URL,
	})
}
