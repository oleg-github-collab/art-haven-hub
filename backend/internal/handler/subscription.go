package handler

import (
	"fmt"
	"net/http"

	stripe "github.com/stripe/stripe-go/v81"
	portalsession "github.com/stripe/stripe-go/v81/billingportal/session"
	"github.com/stripe/stripe-go/v81/checkout/session"
	"github.com/stripe/stripe-go/v81/customer"

	"github.com/art-haven-hub/backend/internal/middleware"
	"github.com/art-haven-hub/backend/internal/model"
	"github.com/art-haven-hub/backend/internal/pkg/response"
	"github.com/art-haven-hub/backend/internal/pkg/validate"
	"github.com/art-haven-hub/backend/internal/repository"
)

type SubscriptionHandler struct {
	repo       *repository.SubscriptionRepo
	userRepo   *repository.UserRepo
	plans      []model.SubscriptionPlan
	successURL string
	cancelURL  string
}

func NewSubscriptionHandler(
	repo *repository.SubscriptionRepo,
	userRepo *repository.UserRepo,
	proPrice, galleryPrice, successURL, cancelURL string,
) *SubscriptionHandler {
	return &SubscriptionHandler{
		repo:     repo,
		userRepo: userRepo,
		plans: []model.SubscriptionPlan{
			{
				ID: "free", Name: "Free", PriceCents: 0, Currency: "EUR", Interval: "month",
				Features: []string{"5 artworks", "Basic analytics", "Standard support"},
			},
			{
				ID: "pro", Name: "Pro", PriceCents: 999, Currency: "EUR", Interval: "month",
				Features:      []string{"50 artworks", "AI translations", "Priority support", "Promotions"},
				StripePriceID: proPrice,
			},
			{
				ID: "gallery", Name: "Gallery", PriceCents: 2499, Currency: "EUR", Interval: "month",
				Features:      []string{"Unlimited artworks", "AI translations", "Dedicated support", "Promotions", "Custom gallery page"},
				StripePriceID: galleryPrice,
			},
		},
		successURL: successURL,
		cancelURL:  cancelURL,
	}
}

func (h *SubscriptionHandler) GetPlans(w http.ResponseWriter, r *http.Request) {
	response.OK(w, h.plans)
}

func (h *SubscriptionHandler) GetMySubscription(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	sub, err := h.repo.GetByUserID(r.Context(), userID)
	if err != nil {
		response.AppError(w, err)
		return
	}

	if sub == nil {
		response.OK(w, map[string]string{"plan": "free", "status": "active"})
		return
	}

	response.OK(w, sub)
}

type SubscribeInput struct {
	PlanID string `json:"plan_id" validate:"required,oneof=pro gallery"`
}

func (h *SubscriptionHandler) Subscribe(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	var input SubscribeInput
	if err := validate.DecodeAndValidate(r, &input); err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	var plan model.SubscriptionPlan
	for _, p := range h.plans {
		if p.ID == input.PlanID {
			plan = p
			break
		}
	}
	if plan.StripePriceID == "" {
		response.Error(w, http.StatusBadRequest, "invalid plan")
		return
	}

	// Get or create Stripe customer
	user, err := h.userRepo.GetByID(r.Context(), userID)
	if err != nil {
		response.AppError(w, err)
		return
	}

	var customerID string
	sub, _ := h.repo.GetByUserID(r.Context(), userID)
	if sub != nil && sub.StripeCustomerID != nil {
		customerID = *sub.StripeCustomerID
	} else {
		cust, err := customer.New(&stripe.CustomerParams{
			Email: stripe.String(user.Email),
			Metadata: map[string]string{
				"user_id": userID.String(),
			},
		})
		if err != nil {
			response.AppError(w, fmt.Errorf("creating stripe customer: %w", err))
			return
		}
		customerID = cust.ID
	}

	params := &stripe.CheckoutSessionParams{
		Mode:     stripe.String(string(stripe.CheckoutSessionModeSubscription)),
		Customer: stripe.String(customerID),
		LineItems: []*stripe.CheckoutSessionLineItemParams{
			{
				Price:    stripe.String(plan.StripePriceID),
				Quantity: stripe.Int64(1),
			},
		},
		SuccessURL: stripe.String(h.successURL),
		CancelURL:  stripe.String(h.cancelURL),
		Metadata: map[string]string{
			"type":    "subscription",
			"user_id": userID.String(),
			"plan":    plan.ID,
		},
	}

	sess, err := session.New(params)
	if err != nil {
		response.AppError(w, fmt.Errorf("creating checkout session: %w", err))
		return
	}

	response.Created(w, map[string]string{
		"session_id":  sess.ID,
		"checkout_url": sess.URL,
	})
}

func (h *SubscriptionHandler) Cancel(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	sub, err := h.repo.GetByUserID(r.Context(), userID)
	if err != nil || sub == nil {
		response.Error(w, http.StatusNotFound, "no active subscription")
		return
	}

	sub.Status = "cancelled"
	sub.Plan = "free"
	if err := h.repo.Update(r.Context(), sub); err != nil {
		response.AppError(w, err)
		return
	}

	response.OK(w, sub)
}

func (h *SubscriptionHandler) Portal(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	sub, err := h.repo.GetByUserID(r.Context(), userID)
	if err != nil || sub == nil || sub.StripeCustomerID == nil {
		response.Error(w, http.StatusNotFound, "no subscription found")
		return
	}

	params := &stripe.BillingPortalSessionParams{
		Customer:  sub.StripeCustomerID,
		ReturnURL: stripe.String(h.successURL),
	}

	sess, err := portalsession.New(params)
	if err != nil {
		response.AppError(w, fmt.Errorf("creating portal session: %w", err))
		return
	}

	response.OK(w, map[string]string{"url": sess.URL})
}
