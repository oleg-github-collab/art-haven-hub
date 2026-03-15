package config

import (
	"time"

	"github.com/caarlos0/env/v11"
)

type Config struct {
	// Server
	Port            int           `env:"PORT" envDefault:"8080"`
	ReadTimeout     time.Duration `env:"READ_TIMEOUT" envDefault:"5s"`
	WriteTimeout    time.Duration `env:"WRITE_TIMEOUT" envDefault:"10s"`
	IdleTimeout     time.Duration `env:"IDLE_TIMEOUT" envDefault:"120s"`
	ShutdownTimeout time.Duration `env:"SHUTDOWN_TIMEOUT" envDefault:"30s"`

	// Database
	DatabaseURL    string        `env:"DATABASE_URL,required"`
	DBMaxOpenConns int           `env:"DB_MAX_OPEN_CONNS" envDefault:"25"`
	DBMaxIdleConns int           `env:"DB_MAX_IDLE_CONNS" envDefault:"10"`
	DBConnMaxLife  time.Duration `env:"DB_CONN_MAX_LIFE" envDefault:"5m"`

	// Redis
	RedisURL string `env:"REDIS_URL" envDefault:"redis://localhost:6379"`

	// JWT
	JWTSecret          string        `env:"JWT_SECRET,required"`
	JWTAccessDuration  time.Duration `env:"JWT_ACCESS_DURATION" envDefault:"15m"`
	JWTRefreshDuration time.Duration `env:"JWT_REFRESH_DURATION" envDefault:"720h"`

	// Google OAuth
	GoogleClientID string `env:"GOOGLE_CLIENT_ID"`

	// CORS
	CORSOrigins []string `env:"CORS_ORIGINS" envSeparator:"," envDefault:"http://localhost:5173,http://localhost:8080"`

	// File Upload
	UploadDir     string `env:"UPLOAD_DIR" envDefault:"./uploads"`
	UploadBaseURL string `env:"UPLOAD_BASE_URL" envDefault:"http://localhost:8080/files"`
	UploadMaxSize int64  `env:"UPLOAD_MAX_SIZE_MB" envDefault:"10"`

	// Stripe
	StripeSecretKey    string `env:"STRIPE_SECRET_KEY"`
	StripeWebhookSecret string `env:"STRIPE_WEBHOOK_SECRET"`
	StripeSuccessURL   string `env:"STRIPE_SUCCESS_URL" envDefault:"http://localhost:5173/payment/success"`
	StripeCancelURL    string `env:"STRIPE_CANCEL_URL" envDefault:"http://localhost:5173/payment/error"`

	// Stripe Subscription Price IDs
	StripeProPriceID     string `env:"STRIPE_PRO_PRICE_ID"`
	StripeGalleryPriceID string `env:"STRIPE_GALLERY_PRICE_ID"`

	// OpenAI (embeddings + translations)
	OpenAIKey string `env:"OPENAI_API_KEY"`

	// Rate Limiting
	RateLimitRPS   float64 `env:"RATE_LIMIT_RPS" envDefault:"100"`
	RateLimitBurst int     `env:"RATE_LIMIT_BURST" envDefault:"200"`

	// Static files (SPA)
	StaticDir string `env:"STATIC_DIR" envDefault:""`

	// Migrations
	MigrationsDir string `env:"MIGRATIONS_DIR" envDefault:"migrations"`

	// Environment
	Env      string `env:"APP_ENV" envDefault:"development"`
	LogLevel string `env:"LOG_LEVEL" envDefault:"info"`
}

func Load() (*Config, error) {
	cfg := &Config{}
	if err := env.Parse(cfg); err != nil {
		return nil, err
	}
	return cfg, nil
}

func (c *Config) IsProduction() bool {
	return c.Env == "production"
}
