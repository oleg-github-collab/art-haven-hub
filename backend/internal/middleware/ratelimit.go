package middleware

import (
	"net/http"
	"sync"

	"golang.org/x/time/rate"

	"github.com/art-haven-hub/backend/internal/pkg/response"
)

type ipRateLimiter struct {
	limiters map[string]*rate.Limiter
	mu       sync.RWMutex
	rps      rate.Limit
	burst    int
}

func (l *ipRateLimiter) getLimiter(ip string) *rate.Limiter {
	l.mu.RLock()
	limiter, exists := l.limiters[ip]
	l.mu.RUnlock()

	if exists {
		return limiter
	}

	l.mu.Lock()
	defer l.mu.Unlock()

	// Double-check after acquiring write lock
	if limiter, exists = l.limiters[ip]; exists {
		return limiter
	}

	limiter = rate.NewLimiter(l.rps, l.burst)
	l.limiters[ip] = limiter
	return limiter
}

func RateLimit(rps float64, burst int) func(http.Handler) http.Handler {
	limiter := &ipRateLimiter{
		limiters: make(map[string]*rate.Limiter),
		rps:      rate.Limit(rps),
		burst:    burst,
	}

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ip := r.RemoteAddr
			if forwarded := r.Header.Get("X-Forwarded-For"); forwarded != "" {
				ip = forwarded
			}

			if !limiter.getLimiter(ip).Allow() {
				w.Header().Set("Retry-After", "1")
				response.Error(w, http.StatusTooManyRequests, "rate limit exceeded")
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}
