package service

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"math/rand"
	"net/http"
	"strconv"
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
	userRepo       *repository.UserRepo
	jwt            *jwt.Manager
	googleClientID string
}

func NewAuthService(userRepo *repository.UserRepo, jwtManager *jwt.Manager, googleClientID string) *AuthService {
	return &AuthService{
		userRepo:       userRepo,
		jwt:            jwtManager,
		googleClientID: googleClientID,
	}
}

type RegisterInput struct {
	Email    string `json:"email" validate:"required,email,max=255"`
	Password string `json:"password" validate:"required,min=8,max=128"`
	Name     string `json:"display_name" validate:"required,min=1,max=100"`
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

type GoogleLoginInput struct {
	IDToken string `json:"id_token" validate:"required"`
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

func (s *AuthService) GoogleLogin(ctx context.Context, input *GoogleLoginInput) (*TokenResponse, error) {
	if s.googleClientID == "" {
		return nil, apperror.Internal("Google OAuth is not configured")
	}

	// Verify ID token with Google
	resp, err := http.Get("https://oauth2.googleapis.com/tokeninfo?id_token=" + input.IDToken)
	if err != nil {
		return nil, fmt.Errorf("verifying google token: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		body, _ := io.ReadAll(resp.Body)
		return nil, apperror.Unauthorized(fmt.Sprintf("invalid Google ID token: %s", string(body)))
	}

	var claims struct {
		Sub           string `json:"sub"`
		Email         string `json:"email"`
		EmailVerified string `json:"email_verified"`
		Name          string `json:"name"`
		Picture       string `json:"picture"`
		Aud           string `json:"aud"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&claims); err != nil {
		return nil, fmt.Errorf("decoding google token info: %w", err)
	}

	if claims.Aud != s.googleClientID {
		return nil, apperror.Unauthorized("token audience mismatch")
	}
	if claims.EmailVerified != "true" {
		return nil, apperror.Unauthorized("email not verified by Google")
	}

	email := strings.ToLower(strings.TrimSpace(claims.Email))

	// Look up existing OAuth account
	oa, err := s.userRepo.GetOAuthAccount(ctx, "google", claims.Sub)
	if err != nil {
		return nil, fmt.Errorf("looking up oauth account: %w", err)
	}

	var user *model.User

	if oa != nil {
		// Existing OAuth link — load user
		user, err = s.userRepo.GetByID(ctx, oa.UserID)
		if err != nil || user == nil {
			return nil, fmt.Errorf("getting linked user: %w", err)
		}
	} else {
		// No OAuth link yet — check if email already registered
		user, err = s.userRepo.GetByEmail(ctx, email)
		if err != nil {
			return nil, fmt.Errorf("checking existing email: %w", err)
		}

		if user == nil {
			// Create new user from Google profile
			handle := generateHandle(email)
			for {
				exists, _ := s.userRepo.HandleExists(ctx, handle)
				if !exists {
					break
				}
				handle = handle[:min(len(handle), 26)] + strconv.Itoa(rand.Intn(9999))
			}

			user = &model.User{
				Email:         email,
				PasswordHash:  nil,
				Name:          claims.Name,
				Handle:        handle,
				PreferredLang: "uk",
				Tags:          model.StringArray{},
			}
			if claims.Picture != "" {
				user.AvatarURL = &claims.Picture
			}

			if err := s.userRepo.Create(ctx, user); err != nil {
				return nil, fmt.Errorf("creating user: %w", err)
			}
			if err := s.userRepo.AddRole(ctx, user.ID, "user"); err != nil {
				return nil, fmt.Errorf("assigning role: %w", err)
			}
		}

		// Link the OAuth account
		oaNew := &model.OAuthAccount{
			UserID:     user.ID,
			Provider:   "google",
			ProviderID: claims.Sub,
		}
		if err := s.userRepo.CreateOAuthAccount(ctx, oaNew); err != nil {
			return nil, fmt.Errorf("creating oauth account: %w", err)
		}
	}

	// Load roles and generate tokens
	roles, err := s.userRepo.GetRoles(ctx, user.ID)
	if err != nil {
		return nil, fmt.Errorf("getting roles: %w", err)
	}
	user.Roles = roles

	return s.generateTokenResponse(ctx, user)
}

func generateHandle(email string) string {
	parts := strings.Split(email, "@")
	handle := strings.ToLower(parts[0])
	var clean []rune
	for _, r := range handle {
		if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') || r == '_' || r == '-' {
			clean = append(clean, r)
		}
	}
	handle = string(clean)
	if len(handle) < 3 {
		handle = handle + "user"
	}
	if len(handle) > 30 {
		handle = handle[:30]
	}
	return handle
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
