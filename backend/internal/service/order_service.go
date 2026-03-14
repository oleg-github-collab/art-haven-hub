package service

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/art-haven-hub/backend/internal/model"
	"github.com/art-haven-hub/backend/internal/pkg/apperror"
	"github.com/art-haven-hub/backend/internal/repository"
	"github.com/google/uuid"
	"github.com/stripe/stripe-go/v81"
	"github.com/stripe/stripe-go/v81/checkout/session"
)

type OrderService struct {
	orderRepo   *repository.OrderRepo
	cartRepo    *repository.CartRepo
	artworkRepo *repository.ArtworkRepo
	successURL  string
	cancelURL   string
}

func NewOrderService(
	orderRepo *repository.OrderRepo,
	cartRepo *repository.CartRepo,
	artworkRepo *repository.ArtworkRepo,
	successURL, cancelURL string,
) *OrderService {
	return &OrderService{
		orderRepo:   orderRepo,
		cartRepo:    cartRepo,
		artworkRepo: artworkRepo,
		successURL:  successURL,
		cancelURL:   cancelURL,
	}
}

type CheckoutInput struct {
	ShippingName    string          `json:"shipping_name" validate:"required,max=200"`
	ShippingEmail   string          `json:"shipping_email" validate:"required,email"`
	ShippingPhone   string          `json:"shipping_phone" validate:"omitempty,max=30"`
	ShippingAddress json.RawMessage `json:"shipping_address"`
	ShippingMethod  string          `json:"shipping_method" validate:"omitempty,max=50"`
	Notes           string          `json:"notes" validate:"omitempty,max=500"`
}

type CheckoutResponse struct {
	OrderID    uuid.UUID `json:"order_id"`
	SessionURL string    `json:"session_url"`
}

func (s *OrderService) CreateCheckoutSession(ctx context.Context, buyerID uuid.UUID, input *CheckoutInput) (*CheckoutResponse, error) {
	items, err := s.cartRepo.GetItems(ctx, buyerID)
	if err != nil {
		return nil, fmt.Errorf("getting cart: %w", err)
	}
	if len(items) == 0 {
		return nil, apperror.BadRequest("cart is empty")
	}

	var totalCents int64
	var totalCommission int64
	var lineItems []*stripe.CheckoutSessionLineItemParams
	var orderItems []model.OrderItem

	for _, item := range items {
		artwork, err := s.artworkRepo.GetByID(ctx, item.ArtworkID)
		if err != nil || artwork == nil {
			return nil, apperror.BadRequest(fmt.Sprintf("artwork %s not found", item.ArtworkID))
		}
		if artwork.Status != "active" && artwork.Status != "promoted" {
			return nil, apperror.BadRequest(fmt.Sprintf("artwork %s is not available", artwork.Title))
		}

		itemTotal := artwork.PriceCents * int64(item.Quantity)
		commission := calculateCommission(itemTotal)
		totalCents += itemTotal
		totalCommission += commission

		lineItems = append(lineItems, &stripe.CheckoutSessionLineItemParams{
			PriceData: &stripe.CheckoutSessionLineItemPriceDataParams{
				Currency: stripe.String(artwork.Currency),
				ProductData: &stripe.CheckoutSessionLineItemPriceDataProductDataParams{
					Name: stripe.String(artwork.Title),
				},
				UnitAmount: stripe.Int64(artwork.PriceCents),
			},
			Quantity: stripe.Int64(int64(item.Quantity)),
		})

		orderItems = append(orderItems, model.OrderItem{
			ArtworkID:       artwork.ID,
			SellerID:        artwork.ArtistID,
			Quantity:        item.Quantity,
			PriceCents:      artwork.PriceCents,
			CommissionCents: commission,
			Currency:        artwork.Currency,
		})
	}

	// Create order in DB
	order := &model.Order{
		BuyerID:         buyerID,
		Status:          "pending",
		TotalCents:      totalCents,
		CommissionCents: totalCommission,
		Currency:        "EUR",
		ShippingName:    &input.ShippingName,
		ShippingEmail:   &input.ShippingEmail,
		ShippingAddress: input.ShippingAddress,
	}
	if input.ShippingPhone != "" {
		order.ShippingPhone = &input.ShippingPhone
	}
	if input.ShippingMethod != "" {
		order.ShippingMethod = &input.ShippingMethod
	}
	if input.Notes != "" {
		order.Notes = &input.Notes
	}

	if err := s.orderRepo.Create(ctx, order); err != nil {
		return nil, fmt.Errorf("creating order: %w", err)
	}

	// Create order items
	for i := range orderItems {
		orderItems[i].OrderID = order.ID
		if err := s.orderRepo.CreateItem(ctx, &orderItems[i]); err != nil {
			return nil, fmt.Errorf("creating order item: %w", err)
		}
	}

	// Create Stripe Checkout Session
	params := &stripe.CheckoutSessionParams{
		PaymentMethodTypes: stripe.StringSlice([]string{"card"}),
		LineItems:          lineItems,
		Mode:               stripe.String(string(stripe.CheckoutSessionModePayment)),
		SuccessURL:         stripe.String(fmt.Sprintf("%s?order_id=%s", s.successURL, order.ID)),
		CancelURL:          stripe.String(fmt.Sprintf("%s?order_id=%s", s.cancelURL, order.ID)),
		ClientReferenceID:  stripe.String(order.ID.String()),
	}
	params.AddMetadata("order_id", order.ID.String())

	sess, err := session.New(params)
	if err != nil {
		return nil, fmt.Errorf("creating stripe session: %w", err)
	}

	// Update order with Stripe session ID
	sessionID := sess.ID
	order.StripeSessionID = &sessionID
	s.orderRepo.UpdateStripeSession(ctx, order.ID, sess.ID)

	return &CheckoutResponse{
		OrderID:    order.ID,
		SessionURL: sess.URL,
	}, nil
}

func (s *OrderService) HandleCheckoutCompleted(ctx context.Context, sessionID, paymentID string) error {
	order, err := s.orderRepo.GetByStripeSession(ctx, sessionID)
	if err != nil {
		return fmt.Errorf("getting order: %w", err)
	}
	if order == nil {
		return fmt.Errorf("order not found for session %s", sessionID)
	}

	if err := s.orderRepo.MarkPaid(ctx, order.ID, paymentID); err != nil {
		return fmt.Errorf("marking paid: %w", err)
	}

	// Clear cart
	s.cartRepo.Clear(ctx, order.BuyerID)

	// Mark artworks as sold
	items, _ := s.orderRepo.GetOrderItems(ctx, order.ID)
	for _, item := range items {
		s.artworkRepo.UpdateStatus(ctx, item.ArtworkID, "sold")
	}

	return nil
}

func (s *OrderService) GetOrder(ctx context.Context, orderID, userID uuid.UUID) (*model.Order, error) {
	order, err := s.orderRepo.GetByID(ctx, orderID)
	if err != nil {
		return nil, fmt.Errorf("getting order: %w", err)
	}
	if order == nil {
		return nil, apperror.NotFound("order", orderID.String())
	}
	if order.BuyerID != userID {
		// Check if user is seller of any item
		isSeller := false
		for _, item := range order.Items {
			if item.SellerID == userID {
				isSeller = true
				break
			}
		}
		if !isSeller {
			return nil, apperror.Forbidden("access denied")
		}
	}
	return order, nil
}

func (s *OrderService) GetBuyerOrders(ctx context.Context, buyerID uuid.UUID, limit, offset int) ([]model.Order, error) {
	return s.orderRepo.GetBuyerOrders(ctx, buyerID, limit, offset)
}

func (s *OrderService) GetSellerOrders(ctx context.Context, sellerID uuid.UUID, limit, offset int) ([]model.Order, error) {
	return s.orderRepo.GetSellerOrders(ctx, sellerID, limit, offset)
}

func (s *OrderService) UpdateOrderStatus(ctx context.Context, orderID, sellerID uuid.UUID, status string) error {
	return s.orderRepo.UpdateStatus(ctx, orderID, status)
}

// Tiered commission: <€1000→15%, <€1500→13.5%, <€2000→11%, <€2500→9%, <€5000→7%, €5000+→5%
func calculateCommission(amountCents int64) int64 {
	var rate float64
	switch {
	case amountCents < 100000:
		rate = 0.15
	case amountCents < 150000:
		rate = 0.135
	case amountCents < 200000:
		rate = 0.11
	case amountCents < 250000:
		rate = 0.09
	case amountCents < 500000:
		rate = 0.07
	default:
		rate = 0.05
	}
	return int64(float64(amountCents) * rate)
}
