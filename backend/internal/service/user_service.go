package service

import (
	"context"
	"fmt"
	"io"
	"mime/multipart"
	"os"
	"path/filepath"
	"strings"

	"github.com/art-haven-hub/backend/internal/model"
	"github.com/art-haven-hub/backend/internal/pkg/apperror"
	"github.com/art-haven-hub/backend/internal/repository"
	"github.com/google/uuid"
)

type UserService struct {
	userRepo    *repository.UserRepo
	uploadDir   string
	uploadBase  string
	maxFileSize int64
}

func NewUserService(userRepo *repository.UserRepo, uploadDir, uploadBase string, maxFileSizeMB int64) *UserService {
	return &UserService{
		userRepo:    userRepo,
		uploadDir:   uploadDir,
		uploadBase:  uploadBase,
		maxFileSize: maxFileSizeMB * 1024 * 1024,
	}
}

type UpdateProfileInput struct {
	Name          string   `json:"name" validate:"omitempty,min=1,max=100"`
	Handle        string   `json:"handle" validate:"omitempty,min=3,max=30"`
	Bio           *string  `json:"bio" validate:"omitempty,max=500"`
	Location      *string  `json:"location" validate:"omitempty,max=100"`
	Website       *string  `json:"website" validate:"omitempty,max=255,url"`
	Tags          []string `json:"tags" validate:"omitempty,max=10,dive,max=50"`
	PreferredLang string   `json:"preferred_lang" validate:"omitempty,oneof=uk en de es fr"`
	CoverColor    string   `json:"cover_color" validate:"omitempty,max=100"`
}

func (s *UserService) GetProfile(ctx context.Context, handle string, viewerID *uuid.UUID) (*model.User, error) {
	user, err := s.userRepo.GetByHandle(ctx, handle)
	if err != nil {
		return nil, fmt.Errorf("getting user: %w", err)
	}
	if user == nil {
		return nil, apperror.NotFound("user", handle)
	}

	roles, _ := s.userRepo.GetRoles(ctx, user.ID)
	user.Roles = roles

	followerCount, _ := s.userRepo.GetFollowerCount(ctx, user.ID)
	followingCount, _ := s.userRepo.GetFollowingCount(ctx, user.ID)
	user.FollowerCount = followerCount
	user.FollowingCount = followingCount

	if viewerID != nil {
		isFollowing, _ := s.userRepo.IsFollowing(ctx, *viewerID, user.ID)
		user.IsFollowing = isFollowing
	}

	return user, nil
}

func (s *UserService) UpdateProfile(ctx context.Context, userID uuid.UUID, input *UpdateProfileInput) (*model.User, error) {
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("getting user: %w", err)
	}
	if user == nil {
		return nil, apperror.NotFound("user", userID.String())
	}

	if input.Name != "" {
		user.Name = input.Name
	}
	if input.Handle != "" && input.Handle != user.Handle {
		exists, err := s.userRepo.HandleExists(ctx, input.Handle)
		if err != nil {
			return nil, fmt.Errorf("checking handle: %w", err)
		}
		if exists {
			return nil, apperror.Conflict("handle already taken")
		}
		user.Handle = input.Handle
	}
	if input.Bio != nil {
		user.Bio = input.Bio
	}
	if input.Location != nil {
		user.Location = input.Location
	}
	if input.Website != nil {
		user.Website = input.Website
	}
	if input.Tags != nil {
		user.Tags = model.StringArray(input.Tags)
	}
	if input.PreferredLang != "" {
		user.PreferredLang = input.PreferredLang
	}
	if input.CoverColor != "" {
		user.CoverColor = input.CoverColor
	}

	if err := s.userRepo.Update(ctx, user); err != nil {
		return nil, fmt.Errorf("updating user: %w", err)
	}

	return user, nil
}

func (s *UserService) UploadAvatar(ctx context.Context, userID uuid.UUID, file multipart.File, header *multipart.FileHeader) (string, error) {
	if header.Size > s.maxFileSize {
		return "", apperror.BadRequest("file too large")
	}

	mime := header.Header.Get("Content-Type")
	if !isAllowedImageMIME(mime) {
		return "", apperror.BadRequest("unsupported file type; use JPEG, PNG, or WebP")
	}

	ext := filepath.Ext(header.Filename)
	if ext == "" {
		ext = mimeToExt(mime)
	}

	filename := fmt.Sprintf("%s%s", uuid.New().String(), ext)
	prefix := userID.String()[:8]
	dir := filepath.Join(s.uploadDir, prefix)
	os.MkdirAll(dir, 0755)

	dst, err := os.Create(filepath.Join(dir, filename))
	if err != nil {
		return "", fmt.Errorf("creating file: %w", err)
	}
	defer dst.Close()

	if _, err := io.Copy(dst, file); err != nil {
		return "", fmt.Errorf("writing file: %w", err)
	}

	avatarURL := fmt.Sprintf("%s/%s/%s", s.uploadBase, prefix, filename)
	if err := s.userRepo.UpdateAvatar(ctx, userID, avatarURL); err != nil {
		return "", fmt.Errorf("updating avatar: %w", err)
	}

	return avatarURL, nil
}

func (s *UserService) Follow(ctx context.Context, followerID, followedID uuid.UUID) error {
	if followerID == followedID {
		return apperror.BadRequest("cannot follow yourself")
	}
	target, err := s.userRepo.GetByID(ctx, followedID)
	if err != nil {
		return fmt.Errorf("getting user: %w", err)
	}
	if target == nil {
		return apperror.NotFound("user", followedID.String())
	}
	return s.userRepo.Follow(ctx, followerID, followedID)
}

func (s *UserService) Unfollow(ctx context.Context, followerID, followedID uuid.UUID) error {
	return s.userRepo.Unfollow(ctx, followerID, followedID)
}

func (s *UserService) GetFollowers(ctx context.Context, userID uuid.UUID, limit, offset int) ([]model.User, error) {
	return s.userRepo.GetFollowers(ctx, userID, limit, offset)
}

func (s *UserService) GetFollowing(ctx context.Context, userID uuid.UUID, limit, offset int) ([]model.User, error) {
	return s.userRepo.GetFollowing(ctx, userID, limit, offset)
}

type ArtistListResult struct {
	Artists []model.User `json:"artists"`
	Total   int          `json:"total"`
}

func (s *UserService) ListArtists(ctx context.Context, search, city, tag string, limit, offset int) (*ArtistListResult, error) {
	users, err := s.userRepo.ListArtists(ctx, search, city, tag, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("listing artists: %w", err)
	}

	// Enrich with follower counts and roles
	for i := range users {
		followerCount, _ := s.userRepo.GetFollowerCount(ctx, users[i].ID)
		followingCount, _ := s.userRepo.GetFollowingCount(ctx, users[i].ID)
		roles, _ := s.userRepo.GetRoles(ctx, users[i].ID)
		users[i].FollowerCount = followerCount
		users[i].FollowingCount = followingCount
		users[i].Roles = roles
	}

	total, err := s.userRepo.CountArtists(ctx, search, city, tag)
	if err != nil {
		return nil, fmt.Errorf("counting artists: %w", err)
	}

	return &ArtistListResult{Artists: users, Total: total}, nil
}

func isAllowedImageMIME(mime string) bool {
	allowed := map[string]bool{
		"image/jpeg": true,
		"image/png":  true,
		"image/webp": true,
	}
	return allowed[strings.ToLower(mime)]
}

func mimeToExt(mime string) string {
	switch strings.ToLower(mime) {
	case "image/jpeg":
		return ".jpg"
	case "image/png":
		return ".png"
	case "image/webp":
		return ".webp"
	default:
		return ".bin"
	}
}
