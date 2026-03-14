package service

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"strings"
	"time"
	"unicode"

	"github.com/art-haven-hub/backend/internal/model"
	"github.com/art-haven-hub/backend/internal/pkg/apperror"
	"github.com/art-haven-hub/backend/internal/pkg/jwt"
	"github.com/art-haven-hub/backend/internal/repository"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

type AuthService struct {
	userRepo *repository.UserRepo
	jwt      *jwt.Manager
}

func NewAuthService(userRepo *repository.UserRepo, jwtManager *jwt.Manager) *AuthService {
	return &AuthService{
		userRepo: userRepo,
		jwt:      jwtManager,
	}
}

type RegisterInput struct {
	Email    string `json:"email" validate:"required,email,max=255"`
	Password string `json:"password" validate:"required,min=8,max=128"`
	Name     string `json:"name" validate:"required,min=1,max=100"`
	Handle   string `json:"handle" validate:"required,min=3,max=30,alphanumunicode"`
	Lang     string `json:"lang" validate:"omitempty,oneof=uk en de es fr"`
}

type LoginInput struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

type RefreshInput struct {
	RefreshToken string `json:"refresh_token" validate:"required"`
}

type TokenResponse struct {
	User         *model.User    `json:"user"`
	AccessToken  string         `json:"access_token"`
	RefreshToken string         `json:"refresh_token"`
	ExpiresAt    int64          `json:"expires_at"`
}

func (s *AuthService) Register(ctx context.Context, input *RegisterInput) (*TokenResponse, error) {
	// Normalize
	input.Email = strings.ToLower(strings.TrimSpace(input.Email))
	input.Handle = strings.ToLower(strings.TrimSpace(input.Handle))

	// Validate handle characters
	for _, r := range input.Handle {
		if !unicode.IsLetter(r) && !unicode.IsDigit(r) && r != '_' && r != '-' {
			return nil, apperror.Validation("handle can only contain letters, digits, underscore, and hyphen")
		}
	}

	// Check duplicates
	emailExists, err := s.userRepo.EmailExists(ctx, input.Email)
	if err != nil {
		return nil, fmt.Errorf("checking email: %w", err)
	}
	if emailExists {
		return nil, apperror.Conflict("email already registered")
	}

	handleExists, err := s.userRepo.HandleExists(ctx, input.Handle)
	if err != nil {
		return nil, fmt.Errorf("checking handle: %w", err)
	}
	if handleExists {
		return nil, apperror.Conflict("handle already taken")
	}

	// Hash password
	hash, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("hashing password: %w", err)
	}
	hashStr := string(hash)

	lang := input.Lang
	if lang == "" {
		lang = "uk"
	}

	user := &model.User{
		Email:         input.Email,
		PasswordHash:  &hashStr,
		Name:          input.Name,
		Handle:        input.Handle,
		PreferredLang: lang,
		Tags:          model.StringArray{},
	}

	if err := s.userRepo.Create(ctx, user); err != nil {
		return nil, fmt.Errorf("creating user: %w", err)
	}

	// Assign default role
	if err := s.userRepo.AddRole(ctx, user.ID, "user"); err != nil {
		return nil, fmt.Errorf("assigning role: %w", err)
	}

	user.Roles = []string{"user"}

	return s.generateTokenResponse(ctx, user)
}

func (s *AuthService) Login(ctx context.Context, input *LoginInput) (*TokenResponse, error) {
	input.Email = strings.ToLower(strings.TrimSpace(input.Email))

	user, err := s.userRepo.GetByEmail(ctx, input.Email)
	if err != nil {
		return nil, fmt.Errorf("getting user: %w", err)
	}
	if user == nil || user.PasswordHash == nil {
		return nil, apperror.Unauthorized("invalid email or password")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(*user.PasswordHash), []byte(input.Password)); err != nil {
		return nil, apperror.Unauthorized("invalid email or password")
	}

	roles, err := s.userRepo.GetRoles(ctx, user.ID)
	if err != nil {
		return nil, fmt.Errorf("getting roles: %w", err)
	}
	user.Roles = roles

	return s.generateTokenResponse(ctx, user)
}

func (s *AuthService) Refresh(ctx context.Context, input *RefreshInput) (*TokenResponse, error) {
	userID, err := s.jwt.ValidateRefreshToken(input.RefreshToken)
	if err != nil {
		return nil, apperror.Unauthorized("invalid or expired refresh token")
	}

	// Check token in DB
	tokenHash := hashToken(input.RefreshToken)
	rt, err := s.userRepo.GetRefreshToken(ctx, tokenHash)
	if err != nil {
		return nil, fmt.Errorf("getting refresh token: %w", err)
	}
	if rt == nil {
		return nil, apperror.Unauthorized("refresh token not found or revoked")
	}

	// Revoke old token (rotation)
	if err := s.userRepo.RevokeRefreshToken(ctx, tokenHash); err != nil {
		return nil, fmt.Errorf("revoking old token: %w", err)
	}

	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("getting user: %w", err)
	}
	if user == nil {
		return nil, apperror.Unauthorized("user not found")
	}

	roles, err := s.userRepo.GetRoles(ctx, user.ID)
	if err != nil {
		return nil, fmt.Errorf("getting roles: %w", err)
	}
	user.Roles = roles

	return s.generateTokenResponse(ctx, user)
}

func (s *AuthService) Logout(ctx context.Context, refreshToken string) error {
	tokenHash := hashToken(refreshToken)
	return s.userRepo.RevokeRefreshToken(ctx, tokenHash)
}

func (s *AuthService) LogoutAll(ctx context.Context, userID uuid.UUID) error {
	return s.userRepo.RevokeAllRefreshTokens(ctx, userID)
}

func (s *AuthService) GetCurrentUser(ctx context.Context, userID uuid.UUID) (*model.User, error) {
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("getting user: %w", err)
	}
	if user == nil {
		return nil, apperror.NotFound("user", userID.String())
	}

	roles, err := s.userRepo.GetRoles(ctx, user.ID)
	if err != nil {
		return nil, fmt.Errorf("getting roles: %w", err)
	}
	user.Roles = roles

	return user, nil
}

func (s *AuthService) generateTokenResponse(ctx context.Context, user *model.User) (*TokenResponse, error) {
	pair, err := s.jwt.GenerateTokenPair(user.ID, user.Roles)
	if err != nil {
		return nil, fmt.Errorf("generating tokens: %w", err)
	}

	// Store hashed refresh token in DB
	rt := &model.RefreshToken{
		UserID:    user.ID,
		TokenHash: hashToken(pair.RefreshToken),
		ExpiresAt: time.Now().Add(30 * 24 * time.Hour), // 30 days
	}
	if err := s.userRepo.SaveRefreshToken(ctx, rt); err != nil {
		return nil, fmt.Errorf("saving refresh token: %w", err)
	}

	return &TokenResponse{
		User:         user,
		AccessToken:  pair.AccessToken,
		RefreshToken: pair.RefreshToken,
		ExpiresAt:    pair.ExpiresAt,
	}, nil
}

func hashToken(token string) string {
	h := sha256.Sum256([]byte(token))
	return hex.EncodeToString(h[:])
}
