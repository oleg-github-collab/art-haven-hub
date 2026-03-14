package server

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	"github.com/art-haven-hub/backend/internal/config"
	"github.com/jmoiron/sqlx"
	"github.com/redis/go-redis/v9"
)

type Server struct {
	cfg    *config.Config
	db     *sqlx.DB
	redis  *redis.Client
}

func New(cfg *config.Config, db *sqlx.DB, rdb *redis.Client) *Server {
	return &Server{
		cfg:   cfg,
		db:    db,
		redis: rdb,
	}
}

func (s *Server) Run() error {
	router := NewRouter(s.cfg, s.db, s.redis)

	httpServer := &http.Server{
		Addr:         fmt.Sprintf(":%d", s.cfg.Port),
		Handler:      router,
		ReadTimeout:  s.cfg.ReadTimeout,
		WriteTimeout: s.cfg.WriteTimeout,
		IdleTimeout:  s.cfg.IdleTimeout,
	}

	// Channel for server errors
	serverErr := make(chan error, 1)
	go func() {
		slog.Info("server starting", "port", s.cfg.Port, "env", s.cfg.Env)
		serverErr <- httpServer.ListenAndServe()
	}()

	// Channel for OS signals
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	select {
	case err := <-serverErr:
		return fmt.Errorf("server error: %w", err)

	case sig := <-quit:
		slog.Info("shutdown signal received", "signal", sig)

		ctx, cancel := context.WithTimeout(context.Background(), s.cfg.ShutdownTimeout)
		defer cancel()

		if err := httpServer.Shutdown(ctx); err != nil {
			httpServer.Close()
			return fmt.Errorf("forced shutdown: %w", err)
		}

		slog.Info("server stopped gracefully")
	}

	return nil
}
