package service

import (
	"context"
	"fmt"

	"github.com/art-haven-hub/backend/internal/model"
	"github.com/art-haven-hub/backend/internal/pkg/apperror"
	"github.com/art-haven-hub/backend/internal/repository"
	"github.com/google/uuid"
)

type ArtworkService struct {
	artworkRepo *repository.ArtworkRepo
}

func NewArtworkService(artworkRepo *repository.ArtworkRepo) *ArtworkService {
	return &ArtworkService{artworkRepo: artworkRepo}
}

type CreateArtworkInput struct {
	Title           string   `json:"title" validate:"required,min=1,max=200"`
	Description     *string  `json:"description" validate:"omitempty,max=2000"`
	FullDescription *string  `json:"full_description" validate:"omitempty,max=10000"`
	PriceCents      int64    `json:"price_cents" validate:"required,min=0"`
	Currency        string   `json:"currency" validate:"omitempty,oneof=EUR USD UAH"`
	CategoryID      string   `json:"category_id" validate:"required"`
	Subcategory     *string  `json:"subcategory"`
	Condition       *string  `json:"condition" validate:"omitempty,oneof=new like_new good fair"`
	Status          string   `json:"status" validate:"omitempty,oneof=draft active"`
	Images          []string `json:"images"`
	Emoji           *string  `json:"emoji"`
	WidthCm         *float64 `json:"width_cm" validate:"omitempty,min=0"`
	HeightCm        *float64 `json:"height_cm" validate:"omitempty,min=0"`
	Tags            []string `json:"tags" validate:"omitempty,max=20,dive,max=50"`
	IsBiddable      bool     `json:"is_biddable"`
	ShippingOptions []string `json:"shipping_options"`
	ReturnPolicy    *string  `json:"return_policy" validate:"omitempty,max=1000"`
	City            *string  `json:"city" validate:"omitempty,max=100"`
	Country         *string  `json:"country" validate:"omitempty,max=100"`
}

type UpdateArtworkInput struct {
	Title           *string  `json:"title" validate:"omitempty,min=1,max=200"`
	Description     *string  `json:"description" validate:"omitempty,max=2000"`
	FullDescription *string  `json:"full_description" validate:"omitempty,max=10000"`
	PriceCents      *int64   `json:"price_cents" validate:"omitempty,min=0"`
	Currency        *string  `json:"currency" validate:"omitempty,oneof=EUR USD UAH"`
	CategoryID      *string  `json:"category_id"`
	Subcategory     *string  `json:"subcategory"`
	Condition       *string  `json:"condition" validate:"omitempty,oneof=new like_new good fair"`
	Status          *string  `json:"status" validate:"omitempty,oneof=draft active"`
	Images          []string `json:"images"`
	Emoji           *string  `json:"emoji"`
	WidthCm         *float64 `json:"width_cm" validate:"omitempty,min=0"`
	HeightCm        *float64 `json:"height_cm" validate:"omitempty,min=0"`
	Tags            []string `json:"tags" validate:"omitempty,max=20,dive,max=50"`
	IsBiddable      *bool    `json:"is_biddable"`
	ShippingOptions []string `json:"shipping_options"`
	ReturnPolicy    *string  `json:"return_policy" validate:"omitempty,max=1000"`
	City            *string  `json:"city" validate:"omitempty,max=100"`
	Country         *string  `json:"country" validate:"omitempty,max=100"`
}

func (s *ArtworkService) Create(ctx context.Context, artistID uuid.UUID, input *CreateArtworkInput) (*model.Artwork, error) {
	currency := input.Currency
	if currency == "" {
		currency = "EUR"
	}
	status := input.Status
	if status == "" {
		status = "draft"
	}

	artwork := &model.Artwork{
		Title:           input.Title,
		Description:     input.Description,
		FullDescription: input.FullDescription,
		PriceCents:      input.PriceCents,
		Currency:        currency,
		ArtistID:        artistID,
		CategoryID:      input.CategoryID,
		Subcategory:     input.Subcategory,
		Condition:       input.Condition,
		Status:          status,
		Images:          model.StringArray(input.Images),
		Emoji:           input.Emoji,
		WidthCm:         input.WidthCm,
		HeightCm:        input.HeightCm,
		Tags:            model.StringArray(input.Tags),
		IsBiddable:      input.IsBiddable,
		ShippingOptions: model.StringArray(input.ShippingOptions),
		ReturnPolicy:    input.ReturnPolicy,
		City:            input.City,
		Country:         input.Country,
	}

	if err := s.artworkRepo.Create(ctx, artwork); err != nil {
		return nil, fmt.Errorf("creating artwork: %w", err)
	}

	return artwork, nil
}

func (s *ArtworkService) GetByID(ctx context.Context, id uuid.UUID, viewerID *uuid.UUID) (*model.Artwork, error) {
	artwork, err := s.artworkRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("getting artwork: %w", err)
	}
	if artwork == nil {
		return nil, apperror.NotFound("artwork", id.String())
	}

	// Enrich with artist info
	artist, _ := s.artworkRepo.GetArtistByID(ctx, artwork.ArtistID)
	artwork.Artist = artist

	// Enrich with rating
	avg, count, _ := s.artworkRepo.GetAvgRating(ctx, id)
	artwork.AvgRating = avg
	artwork.ReviewCount = count

	// Check if favorited by viewer
	if viewerID != nil {
		fav, _ := s.artworkRepo.IsFavorited(ctx, *viewerID, id)
		artwork.IsFavorited = fav
	}

	// Increment view count
	s.artworkRepo.IncrementViewCount(ctx, id)

	return artwork, nil
}

func (s *ArtworkService) Update(ctx context.Context, id, artistID uuid.UUID, input *UpdateArtworkInput) (*model.Artwork, error) {
	artwork, err := s.artworkRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("getting artwork: %w", err)
	}
	if artwork == nil {
		return nil, apperror.NotFound("artwork", id.String())
	}
	if artwork.ArtistID != artistID {
		return nil, apperror.Forbidden("you can only edit your own artworks")
	}

	if input.Title != nil {
		artwork.Title = *input.Title
	}
	if input.Description != nil {
		artwork.Description = input.Description
	}
	if input.FullDescription != nil {
		artwork.FullDescription = input.FullDescription
	}
	if input.PriceCents != nil {
		artwork.PriceCents = *input.PriceCents
	}
	if input.Currency != nil {
		artwork.Currency = *input.Currency
	}
	if input.CategoryID != nil {
		artwork.CategoryID = *input.CategoryID
	}
	if input.Subcategory != nil {
		artwork.Subcategory = input.Subcategory
	}
	if input.Condition != nil {
		artwork.Condition = input.Condition
	}
	if input.Status != nil {
		artwork.Status = *input.Status
	}
	if input.Images != nil {
		artwork.Images = model.StringArray(input.Images)
	}
	if input.Emoji != nil {
		artwork.Emoji = input.Emoji
	}
	if input.WidthCm != nil {
		artwork.WidthCm = input.WidthCm
	}
	if input.HeightCm != nil {
		artwork.HeightCm = input.HeightCm
	}
	if input.Tags != nil {
		artwork.Tags = model.StringArray(input.Tags)
	}
	if input.IsBiddable != nil {
		artwork.IsBiddable = *input.IsBiddable
	}
	if input.ShippingOptions != nil {
		artwork.ShippingOptions = model.StringArray(input.ShippingOptions)
	}
	if input.ReturnPolicy != nil {
		artwork.ReturnPolicy = input.ReturnPolicy
	}
	if input.City != nil {
		artwork.City = input.City
	}
	if input.Country != nil {
		artwork.Country = input.Country
	}

	if err := s.artworkRepo.Update(ctx, artwork); err != nil {
		return nil, fmt.Errorf("updating artwork: %w", err)
	}

	return artwork, nil
}

func (s *ArtworkService) Delete(ctx context.Context, id, artistID uuid.UUID) error {
	artwork, err := s.artworkRepo.GetByID(ctx, id)
	if err != nil {
		return fmt.Errorf("getting artwork: %w", err)
	}
	if artwork == nil {
		return apperror.NotFound("artwork", id.String())
	}
	if artwork.ArtistID != artistID {
		return apperror.Forbidden("you can only delete your own artworks")
	}
	return s.artworkRepo.Delete(ctx, id)
}

func (s *ArtworkService) List(ctx context.Context, f repository.ArtworkFilter) (*repository.ArtworkListResult, error) {
	return s.artworkRepo.List(ctx, f)
}

func (s *ArtworkService) GetCategories(ctx context.Context) ([]model.Category, error) {
	return s.artworkRepo.GetCategories(ctx)
}

// --- Reviews ---

type CreateReviewInput struct {
	Rating  int     `json:"rating" validate:"required,min=1,max=5"`
	Comment *string `json:"comment" validate:"omitempty,max=2000"`
}

func (s *ArtworkService) CreateReview(ctx context.Context, artworkID, userID uuid.UUID, input *CreateReviewInput) (*model.ArtworkReview, error) {
	artwork, err := s.artworkRepo.GetByID(ctx, artworkID)
	if err != nil {
		return nil, fmt.Errorf("getting artwork: %w", err)
	}
	if artwork == nil {
		return nil, apperror.NotFound("artwork", artworkID.String())
	}

	review := &model.ArtworkReview{
		ArtworkID: artworkID,
		UserID:    userID,
		Rating:    input.Rating,
		Comment:   input.Comment,
	}

	if err := s.artworkRepo.CreateReview(ctx, review); err != nil {
		return nil, fmt.Errorf("creating review: %w", err)
	}

	return review, nil
}

func (s *ArtworkService) GetReviews(ctx context.Context, artworkID uuid.UUID, limit, offset int) ([]model.ArtworkReview, error) {
	return s.artworkRepo.GetReviews(ctx, artworkID, limit, offset)
}

// --- Favorites ---

func (s *ArtworkService) AddFavorite(ctx context.Context, userID, artworkID uuid.UUID) error {
	return s.artworkRepo.AddFavorite(ctx, userID, artworkID)
}

func (s *ArtworkService) RemoveFavorite(ctx context.Context, userID, artworkID uuid.UUID) error {
	return s.artworkRepo.RemoveFavorite(ctx, userID, artworkID)
}

func (s *ArtworkService) GetUserFavorites(ctx context.Context, userID uuid.UUID, limit, offset int) ([]model.Artwork, error) {
	return s.artworkRepo.GetUserFavorites(ctx, userID, limit, offset)
}
