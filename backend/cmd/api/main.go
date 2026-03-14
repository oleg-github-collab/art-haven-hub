package main

import (
	"log/slog"
	"os"

	"context"

	"github.com/art-haven-hub/backend/internal/config"
	"github.com/art-haven-hub/backend/internal/db"
	"github.com/art-haven-hub/backend/internal/migrate"
	"github.com/art-haven-hub/backend/internal/repository"
	"github.com/art-haven-hub/backend/internal/server"
	"github.com/art-haven-hub/backend/internal/service"
	"github.com/art-haven-hub/backend/internal/worker"
)

func main() {
	// Load configuration from environment
	cfg, err := config.Load()
	if err != nil {
		slog.Error("failed to load config", "error", err)
		os.Exit(1)
	}

	// Setup structured logging
	logLevel := slog.LevelInfo
	if cfg.Env == "development" {
		logLevel = slog.LevelDebug
	}
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: logLevel,
	}))
	slog.SetDefault(logger)

	// Connect to PostgreSQL
	pgDB, err := db.NewPostgres(cfg)
	if err != nil {
		slog.Error("failed to connect to postgres", "error", err)
		os.Exit(1)
	}
	defer pgDB.Close()
	slog.Info("connected to PostgreSQL")

	// Connect to Redis
	rdb, err := db.NewRedis(cfg)
	if err != nil {
		slog.Error("failed to connect to redis", "error", err)
		os.Exit(1)
	}
	defer rdb.Close()
	slog.Info("connected to Redis")

	// Run database migrations
	if err := migrate.Run(cfg.DatabaseURL, cfg.MigrationsDir); err != nil {
		slog.Error("failed to run migrations", "error", err)
		os.Exit(1)
	}
	slog.Info("migrations completed")

	// Create upload directory
	if cfg.UploadDir != "" {
		os.MkdirAll(cfg.UploadDir, 0755)
	}

	// Start background workers
	promotionRepo := repository.NewPromotionRepo(pgDB)
	searchRepo := repository.NewSearchRepo(pgDB)
	embeddingSvc := service.NewEmbeddingService(cfg.OpenAIKey)

	workerMgr := worker.NewManager(pgDB, rdb, promotionRepo)
	workerCtx, workerCancel := context.WithCancel(context.Background())
	defer workerCancel()
	workerMgr.Start(workerCtx)

	// Start embedding worker
	embeddingWorker := worker.NewEmbeddingWorker(pgDB, rdb, searchRepo, embeddingSvc)
	embeddingWorker.Start(workerCtx)

	// Start server
	srv := server.New(cfg, pgDB, rdb)
	if err := srv.Run(); err != nil {
		slog.Error("server failed", "error", err)
		os.Exit(1)
	}
}
