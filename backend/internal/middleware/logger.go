package middleware

import (
	"log/slog"
	"net/http"
	"time"
)

type wrappedWriter struct {
	http.ResponseWriter
	status      int
	wroteHeader bool
}

func (w *wrappedWriter) WriteHeader(code int) {
	if !w.wroteHeader {
		w.status = code
		w.wroteHeader = true
		w.ResponseWriter.WriteHeader(code)
	}
}

func Logger(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		ww := &wrappedWriter{ResponseWriter: w, status: http.StatusOK}

		next.ServeHTTP(ww, r)

		duration := time.Since(start)

		level := slog.LevelInfo
		if ww.status >= 500 {
			level = slog.LevelError
		} else if ww.status >= 400 {
			level = slog.LevelWarn
		}

		slog.Log(r.Context(), level, "request",
			"method", r.Method,
			"path", r.URL.Path,
			"status", ww.status,
			"duration_ms", duration.Milliseconds(),
			"ip", r.RemoteAddr,
			"request_id", r.Context().Value(RequestIDKey),
		)
	})
}
