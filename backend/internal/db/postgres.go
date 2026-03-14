package db

import (
	"context"
	"fmt"
	"time"

	"github.com/art-haven-hub/backend/internal/config"
	"github.com/jmoiron/sqlx"
	_ "github.com/jackc/pgx/v5/stdlib"
)

func NewPostgres(cfg *config.Config) (*sqlx.DB, error) {
	db, err := sqlx.Connect("pgx", cfg.DatabaseURL)
	if err != nil {
		return nil, fmt.Errorf("connecting to postgres: %w", err)
	}

	db.SetMaxOpenConns(cfg.DBMaxOpenConns)
	db.SetMaxIdleConns(cfg.DBMaxIdleConns)
	db.SetConnMaxLifetime(cfg.DBConnMaxLife)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := db.PingContext(ctx); err != nil {
		return nil, fmt.Errorf("pinging postgres: %w", err)
	}

	return db, nil
}
