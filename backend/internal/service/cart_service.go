package service

import (
	"context"
	"fmt"

	"github.com/art-haven-hub/backend/internal/model"
	"github.com/art-haven-hub/backend/internal/repository"
	"github.com/google/uuid"
)

type CartService struct {
	cartRepo    *repository.CartRepo
	artworkRepo *repository.ArtworkRepo
}

func NewCartService(cartRepo *repository.CartRepo, artworkRepo *repository.ArtworkRepo) *CartService {
	return &CartService{cartRepo: cartRepo, artworkRepo: artworkRepo}
}

type CartItemInput struct {
	ArtworkID uuid.UUID `json:"artwork_id" validate:"required"`
	Quantity  int       `json:"quantity" validate:"required,min=1,max=10"`
}

type CartSyncInput struct {
	Items []CartItemInput `json:"items" validate:"required,dive"`
}

func (s *CartService) GetCart(ctx context.Context, userID uuid.UUID) ([]model.CartItem, error) {
	items, err := s.cartRepo.GetItems(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("getting cart: %w", err)
	}

	// Enrich with artwork details
	for i := range items {
		artwork, _ := s.artworkRepo.GetByID(ctx, items[i].ArtworkID)
		items[i].Artwork = artwork
	}

	return items, nil
}

func (s *CartService) AddItem(ctx context.Context, userID uuid.UUID, input *CartItemInput) error {
	return s.cartRepo.AddItem(ctx, userID, input.ArtworkID, input.Quantity)
}

func (s *CartService) UpdateItem(ctx context.Context, userID uuid.UUID, input *CartItemInput) error {
	return s.cartRepo.UpdateQuantity(ctx, userID, input.ArtworkID, input.Quantity)
}

func (s *CartService) RemoveItem(ctx context.Context, userID, artworkID uuid.UUID) error {
	return s.cartRepo.RemoveItem(ctx, userID, artworkID)
}

func (s *CartService) Clear(ctx context.Context, userID uuid.UUID) error {
	return s.cartRepo.Clear(ctx, userID)
}

func (s *CartService) Sync(ctx context.Context, userID uuid.UUID, input *CartSyncInput) error {
	if err := s.cartRepo.Clear(ctx, userID); err != nil {
		return fmt.Errorf("clearing cart: %w", err)
	}
	for _, item := range input.Items {
		if err := s.cartRepo.AddItem(ctx, userID, item.ArtworkID, item.Quantity); err != nil {
			return fmt.Errorf("adding item: %w", err)
		}
	}
	return nil
}
