package middleware

import (
	"context"
	"net/http"
	"strings"

	"github.com/art-haven-hub/backend/internal/pkg/jwt"
	"github.com/art-haven-hub/backend/internal/pkg/response"
	"github.com/google/uuid"
)

type contextKey string

const (
	UserIDKey contextKey = "user_id"
	RolesKey  contextKey = "roles"
)

// Auth returns middleware that requires a valid JWT access token.
func Auth(jwtManager *jwt.Manager) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			token := extractBearerToken(r)
			if token == "" {
				response.Error(w, http.StatusUnauthorized, "missing authorization token")
				return
			}

			claims, err := jwtManager.ValidateAccessToken(token)
			if err != nil {
				response.Error(w, http.StatusUnauthorized, "invalid or expired token")
				return
			}

			ctx := context.WithValue(r.Context(), UserIDKey, claims.UserID)
			ctx = context.WithValue(ctx, RolesKey, claims.Roles)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// OptionalAuth extracts user info from JWT if present, but doesn't require it.
func OptionalAuth(jwtManager *jwt.Manager) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			token := extractBearerToken(r)
			if token != "" {
				claims, err := jwtManager.ValidateAccessToken(token)
				if err == nil {
					ctx := context.WithValue(r.Context(), UserIDKey, claims.UserID)
					ctx = context.WithValue(ctx, RolesKey, claims.Roles)
					r = r.WithContext(ctx)
				}
			}
			next.ServeHTTP(w, r)
		})
	}
}

// RequireRole returns middleware that checks if the user has the specified role.
func RequireRole(role string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			roles, ok := r.Context().Value(RolesKey).([]string)
			if !ok {
				response.Error(w, http.StatusForbidden, "access denied")
				return
			}

			for _, userRole := range roles {
				if userRole == role || userRole == "admin" {
					next.ServeHTTP(w, r)
					return
				}
			}

			response.Error(w, http.StatusForbidden, "access denied: requires "+role+" role")
		})
	}
}

// GetUserID extracts the user ID from the request context.
func GetUserID(ctx context.Context) (uuid.UUID, bool) {
	id, ok := ctx.Value(UserIDKey).(uuid.UUID)
	return id, ok
}

// GetRoles extracts the user roles from the request context.
func GetRoles(ctx context.Context) []string {
	roles, _ := ctx.Value(RolesKey).([]string)
	return roles
}

func extractBearerToken(r *http.Request) string {
	auth := r.Header.Get("Authorization")
	if auth == "" {
		return ""
	}
	parts := strings.SplitN(auth, " ", 2)
	if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
		return ""
	}
	return strings.TrimSpace(parts[1])
}
