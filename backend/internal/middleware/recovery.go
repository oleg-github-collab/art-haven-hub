package middleware

import (
	"log/slog"
	"net/http"
	"runtime/debug"

	"github.com/art-haven-hub/backend/internal/pkg/response"
)

func Recovery(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if err := recover(); err != nil {
				slog.Error("panic recovered",
					"error", err,
					"stack", string(debug.Stack()),
					"path", r.URL.Path,
					"method", r.Method,
					"request_id", r.Context().Value(RequestIDKey),
				)
				response.Error(w, http.StatusInternalServerError, "internal server error")
			}
		}()
		next.ServeHTTP(w, r)
	})
}
