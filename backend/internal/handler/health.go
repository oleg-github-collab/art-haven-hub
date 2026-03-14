package handler

import (
	"context"
	"net/http"
	"time"

	"github.com/jmoiron/sqlx"
	"github.com/redis/go-redis/v9"

	"github.com/art-haven-hub/backend/internal/pkg/response"
)

type HealthHandler struct {
	db    *sqlx.DB
	redis *redis.Client
}

func NewHealthHandler(db *sqlx.DB, rdb *redis.Client) *HealthHandler {
	return &HealthHandler{db: db, redis: rdb}
}

func (h *HealthHandler) Health(w http.ResponseWriter, r *http.Request) {
	response.JSON(w, http.StatusOK, map[string]string{
		"status": "alive",
	})
}

func (h *HealthHandler) Ready(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
	defer cancel()

	checks := map[string]string{}
	healthy := true

	if err := h.db.PingContext(ctx); err != nil {
		checks["database"] = "unhealthy: " + err.Error()
		healthy = false
	} else {
		checks["database"] = "healthy"
	}

	if err := h.redis.Ping(ctx).Err(); err != nil {
		checks["redis"] = "unhealthy: " + err.Error()
		healthy = false
	} else {
		checks["redis"] = "healthy"
	}

	status := "ready"
	httpStatus := http.StatusOK
	if !healthy {
		status = "not ready"
		httpStatus = http.StatusServiceUnavailable
	}

	response.JSON(w, httpStatus, map[string]interface{}{
		"status": status,
		"checks": checks,
	})
}
