# Інтеграція з Go Backend — Продакшн-гайд

Повна документація з побудови відмовостійкого, масштабованого бекенду на Go для платформи Мистецтво.

## Зміст

1. [Архітектура](#архітектура)
2. [Технологічний стек](#технологічний-стек)
3. [Структура проекту](#структура-проекту)
4. [Базова конфігурація](#базова-конфігурація)
5. [Маршрутизація та Middleware](#маршрутизація-та-middleware)
6. [Моделі даних](#моделі-даних)
7. [База даних](#база-даних)
8. [Автентифікація (JWT)](#автентифікація-jwt)
9. [API Endpoints](#api-endpoints)
10. [Обробка файлів (S3)](#обробка-файлів)
11. [Graceful Shutdown](#graceful-shutdown)
12. [Health Checks та Readiness](#health-checks)
13. [Rate Limiting](#rate-limiting)
14. [Логування та Трейсинг](#логування-та-трейсинг)
15. [Тестування](#тестування)
16. [Docker та CI/CD](#docker-та-cicd)
17. [Kubernetes Deployment](#kubernetes)
18. [Моніторинг](#моніторинг)
19. [Підключення до Frontend](#підключення-до-frontend)

---

## Архітектура

```
                    ┌─────────────┐
                    │   Nginx /   │
                    │  Traefik    │
                    │  (Reverse   │
                    │   Proxy)    │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
        ┌─────▼─────┐ ┌───▼────┐ ┌────▼─────┐
        │  Go API   │ │ Go API │ │  Go API  │
        │ Instance 1│ │ Inst 2 │ │  Inst 3  │
        └─────┬─────┘ └───┬────┘ └────┬─────┘
              │            │            │
              └────────────┼────────────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
        ┌─────▼─────┐ ┌───▼────┐ ┌────▼─────┐
        │ PostgreSQL│ │ Redis  │ │   S3 /   │
        │  Primary  │ │Cluster │ │  MinIO   │
        │ + Replica │ │        │ │          │
        └───────────┘ └────────┘ └──────────┘
```

### Принципи

- **12-Factor App** — конфігурація через env vars, stateless процеси
- **Graceful degradation** — часткова працездатність при збоях залежностей
- **Circuit breaker** — захист від каскадних збоїв
- **Structured logging** — JSON логи для агрегації
- **Health checks** — liveness + readiness для оркестратора

## Технологічний стек

| Компонент | Бібліотека | Призначення |
|---|---|---|
| HTTP Router | `chi` v5 | Легкий, idiomatic роутер |
| ORM / SQL | `sqlx` | Типобезпечний SQL без ORM overhead |
| Міграції | `golang-migrate` | Версіонування схеми БД |
| JWT | `golang-jwt/jwt` v5 | Автентифікація |
| Валідація | `go-playground/validator` v10 | Валідація структур |
| Логування | `slog` (stdlib) | Структуроване логування |
| Метрики | `prometheus/client_golang` | Prometheus метрики |
| Трейсинг | `go.opentelemetry.io/otel` | Distributed tracing |
| Rate Limit | `golang.org/x/time/rate` | Token bucket limiter |
| S3 | `aws-sdk-go-v2` | Файлове сховище |
| Config | `caarlos0/env` | Парсинг env vars |
| Testing | `stretchr/testify` | Assertions та mocks |

## Структура проекту

```
go-backend/
├── cmd/
│   └── api/
│       └── main.go              # Точка входу
├── internal/
│   ├── config/
│   │   └── config.go            # Конфігурація з env vars
│   ├── server/
│   │   ├── server.go            # HTTP сервер + graceful shutdown
│   │   └── routes.go            # Реєстрація маршрутів
│   ├── middleware/
│   │   ├── auth.go              # JWT middleware
│   │   ├── cors.go              # CORS
│   │   ├── ratelimit.go         # Rate limiting
│   │   ├── requestid.go         # Request ID
│   │   ├── logger.go            # Request logging
│   │   └── recovery.go          # Panic recovery
│   ├── handler/
│   │   ├── auth.go              # POST /auth/login, /auth/register
│   │   ├── artwork.go           # CRUD /artworks
│   │   ├── artist.go            # GET /artists
│   │   ├── order.go             # CRUD /orders
│   │   ├── upload.go            # POST /uploads
│   │   ├── blog.go              # GET /blog
│   │   └── health.go            # GET /health, /ready
│   ├── model/
│   │   ├── user.go
│   │   ├── artwork.go
│   │   ├── order.go
│   │   └── blog.go
│   ├── repository/
│   │   ├── user_repo.go
│   │   ├── artwork_repo.go
│   │   ├── order_repo.go
│   │   └── blog_repo.go
│   ├── service/
│   │   ├── auth_service.go
│   │   ├── artwork_service.go
│   │   ├── order_service.go
│   │   └── upload_service.go
│   └── pkg/
│       ├── apperror/             # Типізовані помилки
│       ├── jwt/                  # JWT утиліти
│       ├── pagination/           # Cursor/offset пагінація
│       ├── response/             # JSON response helpers
│       └── validator/            # Валідація
├── migrations/
│   ├── 000001_create_users.up.sql
│   ├── 000001_create_users.down.sql
│   ├── 000002_create_artworks.up.sql
│   └── ...
├── Dockerfile
├── docker-compose.yml
├── Makefile
├── go.mod
└── go.sum
```

## Базова конфігурація

```go
// internal/config/config.go
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
	DatabaseURL     string `env:"DATABASE_URL,required"`
	DBMaxOpenConns  int    `env:"DB_MAX_OPEN_CONNS" envDefault:"25"`
	DBMaxIdleConns  int    `env:"DB_MAX_IDLE_CONNS" envDefault:"10"`
	DBConnMaxLife   time.Duration `env:"DB_CONN_MAX_LIFE" envDefault:"5m"`

	// Redis
	RedisURL string `env:"REDIS_URL" envDefault:"redis://localhost:6379"`

	// JWT
	JWTSecret          string        `env:"JWT_SECRET,required"`
	JWTAccessDuration  time.Duration `env:"JWT_ACCESS_DURATION" envDefault:"15m"`
	JWTRefreshDuration time.Duration `env:"JWT_REFRESH_DURATION" envDefault:"720h"`

	// S3
	S3Endpoint  string `env:"S3_ENDPOINT"`
	S3Bucket    string `env:"S3_BUCKET" envDefault:"mystetstvo-uploads"`
	S3Region    string `env:"S3_REGION" envDefault:"eu-central-1"`
	S3AccessKey string `env:"S3_ACCESS_KEY"`
	S3SecretKey string `env:"S3_SECRET_KEY"`

	// CORS
	CORSOrigins []string `env:"CORS_ORIGINS" envSeparator:"," envDefault:"http://localhost:5173"`

	// Rate Limiting
	RateLimitRPS   float64 `env:"RATE_LIMIT_RPS" envDefault:"100"`
	RateLimitBurst int     `env:"RATE_LIMIT_BURST" envDefault:"200"`

	// Environment
	Env string `env:"APP_ENV" envDefault:"development"`
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
```

## Маршрутизація та Middleware

```go
// internal/server/routes.go
package server

import (
	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"
)

func (s *Server) routes() *chi.Mux {
	r := chi.NewRouter()

	// ── Global middleware ──
	r.Use(chimw.RealIP)
	r.Use(s.middleware.RequestID)
	r.Use(s.middleware.Logger)
	r.Use(s.middleware.Recovery)
	r.Use(s.middleware.CORS)
	r.Use(s.middleware.RateLimit)
	r.Use(chimw.Compress(5))

	// ── Health ──
	r.Get("/health", s.handler.Health)
	r.Get("/ready", s.handler.Ready)

	// ── API v1 ──
	r.Route("/api/v1", func(r chi.Router) {

		// Public
		r.Post("/auth/register", s.handler.Register)
		r.Post("/auth/login", s.handler.Login)
		r.Post("/auth/refresh", s.handler.RefreshToken)
		r.Post("/auth/forgot-password", s.handler.ForgotPassword)
		r.Post("/auth/reset-password", s.handler.ResetPassword)

		r.Get("/artworks", s.handler.ListArtworks)
		r.Get("/artworks/{id}", s.handler.GetArtwork)
		r.Get("/artists", s.handler.ListArtists)
		r.Get("/artists/{id}", s.handler.GetArtist)
		r.Get("/blog", s.handler.ListPosts)
		r.Get("/blog/{slug}", s.handler.GetPost)
		r.Get("/events", s.handler.ListEvents)

		// Protected
		r.Group(func(r chi.Router) {
			r.Use(s.middleware.Auth)

			r.Get("/auth/me", s.handler.Me)
			r.Post("/auth/logout", s.handler.Logout)

			r.Post("/artworks", s.handler.CreateArtwork)
			r.Put("/artworks/{id}", s.handler.UpdateArtwork)
			r.Delete("/artworks/{id}", s.handler.DeleteArtwork)
			r.Post("/artworks/bulk", s.handler.BulkArtworkAction)

			r.Get("/orders", s.handler.ListOrders)
			r.Post("/orders", s.handler.CreateOrder)
			r.Get("/orders/{id}", s.handler.GetOrder)

			r.Post("/uploads", s.handler.Upload)
			r.Delete("/uploads/{key}", s.handler.DeleteUpload)

			r.Get("/profile", s.handler.GetProfile)
			r.Put("/profile", s.handler.UpdateProfile)

			r.Get("/messenger/conversations", s.handler.ListConversations)
			r.Get("/messenger/conversations/{id}/messages", s.handler.ListMessages)
			r.Post("/messenger/conversations/{id}/messages", s.handler.SendMessage)

			r.Get("/cart", s.handler.GetCart)
			r.Post("/cart/items", s.handler.AddCartItem)
			r.Delete("/cart/items/{id}", s.handler.RemoveCartItem)

			r.Get("/dashboard/analytics", s.handler.GetAnalytics)
		})

		// Admin
		r.Group(func(r chi.Router) {
			r.Use(s.middleware.Auth)
			r.Use(s.middleware.RequireRole("admin"))

			r.Get("/admin/users", s.handler.AdminListUsers)
			r.Put("/admin/users/{id}/role", s.handler.AdminUpdateRole)
		})
	})

	return r
}
```

### CORS Middleware

```go
// internal/middleware/cors.go
package middleware

import (
	"net/http"
	"strings"
)

func (m *Middleware) CORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")

		for _, allowed := range m.cfg.CORSOrigins {
			if origin == allowed || allowed == "*" {
				w.Header().Set("Access-Control-Allow-Origin", origin)
				break
			}
		}

		w.Header().Set("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS,PATCH")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type,Authorization,X-Request-ID")
		w.Header().Set("Access-Control-Allow-Credentials", "true")
		w.Header().Set("Access-Control-Max-Age", "86400")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}
```

## Моделі даних

```go
// internal/model/artwork.go
package model

import (
	"time"
	"github.com/google/uuid"
)

type ArtworkStatus string

const (
	ArtworkStatusDraft    ArtworkStatus = "draft"
	ArtworkStatusActive   ArtworkStatus = "active"
	ArtworkStatusSold     ArtworkStatus = "sold"
	ArtworkStatusArchived ArtworkStatus = "archived"
)

type Artwork struct {
	ID             uuid.UUID     `json:"id" db:"id"`
	Title          string        `json:"title" db:"title"`
	Description    *string       `json:"description,omitempty" db:"description"`
	Price          int64         `json:"price" db:"price"` // kopecks
	Currency       string        `json:"currency" db:"currency"`
	ArtistID       uuid.UUID     `json:"artist_id" db:"artist_id"`
	Category       string        `json:"category" db:"category"`
	Medium         string        `json:"medium" db:"medium"`
	Width          *float64      `json:"width,omitempty" db:"width"`   // cm
	Height         *float64      `json:"height,omitempty" db:"height"` // cm
	Status         ArtworkStatus `json:"status" db:"status"`
	Images         []string      `json:"images" db:"images"`
	Translations   JSON          `json:"translations,omitempty" db:"translations"`
	Tags           []string      `json:"tags" db:"tags"`
	ViewCount      int           `json:"view_count" db:"view_count"`
	FavoriteCount  int           `json:"favorite_count" db:"favorite_count"`
	IsPromoted     bool          `json:"is_promoted" db:"is_promoted"`
	PromotedUntil  *time.Time    `json:"promoted_until,omitempty" db:"promoted_until"`
	CreatedAt      time.Time     `json:"created_at" db:"created_at"`
	UpdatedAt      time.Time     `json:"updated_at" db:"updated_at"`
}

type CreateArtworkRequest struct {
	Title       string   `json:"title" validate:"required,min=2,max=200"`
	Description *string  `json:"description" validate:"omitempty,max=5000"`
	Price       int64    `json:"price" validate:"required,min=100"`
	Currency    string   `json:"currency" validate:"required,oneof=UAH USD EUR"`
	Category    string   `json:"category" validate:"required"`
	Medium      string   `json:"medium" validate:"required"`
	Width       *float64 `json:"width" validate:"omitempty,min=1,max=10000"`
	Height      *float64 `json:"height" validate:"omitempty,min=1,max=10000"`
	Images      []string `json:"images" validate:"required,min=1,max=20"`
	Tags        []string `json:"tags" validate:"omitempty,max=10"`
}

type ArtworkFilters struct {
	Category  *string        `json:"category"`
	MinPrice  *int64         `json:"min_price"`
	MaxPrice  *int64         `json:"max_price"`
	Status    *ArtworkStatus `json:"status"`
	ArtistID  *uuid.UUID     `json:"artist_id"`
	Search    *string        `json:"search"`
	SortBy    string         `json:"sort_by" validate:"oneof=created_at price view_count"`
	SortOrder string         `json:"sort_order" validate:"oneof=asc desc"`
	Page      int            `json:"page" validate:"min=1"`
	PerPage   int            `json:"per_page" validate:"min=1,max=100"`
}
```

```go
// internal/model/user.go
package model

import (
	"time"
	"github.com/google/uuid"
)

type UserRole string

const (
	UserRoleUser      UserRole = "user"
	UserRoleArtist    UserRole = "artist"
	UserRoleModerator UserRole = "moderator"
	UserRoleAdmin     UserRole = "admin"
)

type User struct {
	ID           uuid.UUID  `json:"id" db:"id"`
	Email        string     `json:"email" db:"email"`
	PasswordHash string     `json:"-" db:"password_hash"`
	Name         string     `json:"name" db:"name"`
	Handle       string     `json:"handle" db:"handle"`
	Avatar       *string    `json:"avatar,omitempty" db:"avatar"`
	Bio          *string    `json:"bio,omitempty" db:"bio"`
	Location     *string    `json:"location,omitempty" db:"location"`
	Website      *string    `json:"website,omitempty" db:"website"`
	IsVerified   bool       `json:"is_verified" db:"is_verified"`
	CreatedAt    time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at" db:"updated_at"`
}

// Roles stored in separate table — NEVER on user record
type UserRoleAssignment struct {
	ID     uuid.UUID `json:"id" db:"id"`
	UserID uuid.UUID `json:"user_id" db:"user_id"`
	Role   UserRole  `json:"role" db:"role"`
}
```

## База даних

### Міграції

```sql
-- migrations/000001_create_users.up.sql

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- для full-text search

CREATE TYPE user_role AS ENUM ('user', 'artist', 'moderator', 'admin');

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    handle TEXT UNIQUE NOT NULL,
    avatar TEXT,
    bio TEXT,
    location TEXT,
    website TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    role user_role NOT NULL,
    UNIQUE(user_id, role)
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_handle ON users(handle);
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
```

```sql
-- migrations/000002_create_artworks.up.sql

CREATE TYPE artwork_status AS ENUM ('draft', 'active', 'sold', 'archived');

CREATE TABLE artworks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    price BIGINT NOT NULL CHECK (price >= 0),
    currency TEXT NOT NULL DEFAULT 'UAH',
    artist_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    category TEXT NOT NULL,
    medium TEXT NOT NULL DEFAULT '',
    width DOUBLE PRECISION,
    height DOUBLE PRECISION,
    status artwork_status DEFAULT 'draft',
    images TEXT[] NOT NULL DEFAULT '{}',
    translations JSONB DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    view_count INT DEFAULT 0,
    favorite_count INT DEFAULT 0,
    is_promoted BOOLEAN DEFAULT FALSE,
    promoted_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_artworks_artist ON artworks(artist_id);
CREATE INDEX idx_artworks_status ON artworks(status);
CREATE INDEX idx_artworks_category ON artworks(category);
CREATE INDEX idx_artworks_price ON artworks(price);
CREATE INDEX idx_artworks_created ON artworks(created_at DESC);
CREATE INDEX idx_artworks_search ON artworks USING gin(to_tsvector('simple', title || ' ' || COALESCE(description, '')));
```

```sql
-- migrations/000003_create_orders.up.sql

CREATE TYPE order_status AS ENUM ('pending', 'paid', 'shipped', 'delivered', 'cancelled', 'refunded');

CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    buyer_id UUID REFERENCES users(id) NOT NULL,
    status order_status DEFAULT 'pending',
    total_amount BIGINT NOT NULL,
    currency TEXT NOT NULL DEFAULT 'UAH',
    shipping_address JSONB,
    payment_intent_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
    artwork_id UUID REFERENCES artworks(id) NOT NULL,
    price BIGINT NOT NULL,
    quantity INT NOT NULL DEFAULT 1
);

CREATE INDEX idx_orders_buyer ON orders(buyer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order ON order_items(order_id);
```

### Підключення з connection pool

```go
// internal/db/postgres.go
package db

import (
	"context"
	"time"

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
```

## Автентифікація (JWT)

```go
// internal/pkg/jwt/jwt.go
package jwt

import (
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

type Claims struct {
	UserID uuid.UUID `json:"uid"`
	Email  string    `json:"email"`
	jwt.RegisteredClaims
}

type TokenPair struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	ExpiresAt    int64  `json:"expires_at"`
}

func GenerateTokenPair(userID uuid.UUID, email, secret string, accessDur, refreshDur time.Duration) (*TokenPair, error) {
	now := time.Now()

	accessClaims := Claims{
		UserID: userID,
		Email:  email,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(now.Add(accessDur)),
			IssuedAt:  jwt.NewNumericDate(now),
			Subject:   userID.String(),
		},
	}

	accessToken, err := jwt.NewWithClaims(jwt.SigningMethodHS256, accessClaims).
		SignedString([]byte(secret))
	if err != nil {
		return nil, err
	}

	refreshClaims := jwt.RegisteredClaims{
		ExpiresAt: jwt.NewNumericDate(now.Add(refreshDur)),
		IssuedAt:  jwt.NewNumericDate(now),
		Subject:   userID.String(),
	}

	refreshToken, err := jwt.NewWithClaims(jwt.SigningMethodHS256, refreshClaims).
		SignedString([]byte(secret))
	if err != nil {
		return nil, err
	}

	return &TokenPair{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresAt:    now.Add(accessDur).Unix(),
	}, nil
}

func ValidateToken(tokenStr, secret string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenStr, &Claims{}, func(t *jwt.Token) (interface{}, error) {
		return []byte(secret), nil
	})
	if err != nil {
		return nil, err
	}
	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, fmt.Errorf("invalid token")
	}
	return claims, nil
}
```

### Auth Middleware

```go
// internal/middleware/auth.go
package middleware

import (
	"context"
	"net/http"
	"strings"
)

type contextKey string
const UserContextKey contextKey = "user"

func (m *Middleware) Auth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		header := r.Header.Get("Authorization")
		if header == "" {
			http.Error(w, `{"error":"missing authorization header"}`, http.StatusUnauthorized)
			return
		}

		parts := strings.SplitN(header, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			http.Error(w, `{"error":"invalid authorization format"}`, http.StatusUnauthorized)
			return
		}

		claims, err := jwt.ValidateToken(parts[1], m.cfg.JWTSecret)
		if err != nil {
			http.Error(w, `{"error":"invalid or expired token"}`, http.StatusUnauthorized)
			return
		}

		ctx := context.WithValue(r.Context(), UserContextKey, claims)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func (m *Middleware) RequireRole(role string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			claims := r.Context().Value(UserContextKey).(*jwt.Claims)
			
			hasRole, err := m.roleRepo.HasRole(r.Context(), claims.UserID, role)
			if err != nil || !hasRole {
				http.Error(w, `{"error":"forbidden"}`, http.StatusForbidden)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}
```

## API Endpoints

### Повний список

| Method | Endpoint | Auth | Опис |
|--------|----------|------|------|
| `POST` | `/api/v1/auth/register` | — | Реєстрація |
| `POST` | `/api/v1/auth/login` | — | Вхід, повертає JWT pair |
| `POST` | `/api/v1/auth/refresh` | — | Оновлення access token |
| `POST` | `/api/v1/auth/forgot-password` | — | Скидання паролю |
| `POST` | `/api/v1/auth/reset-password` | — | Новий пароль |
| `GET` | `/api/v1/auth/me` | ✅ | Поточний користувач |
| `POST` | `/api/v1/auth/logout` | ✅ | Вихід |
| `GET` | `/api/v1/artworks` | — | Список (пагінація, фільтри, пошук) |
| `GET` | `/api/v1/artworks/{id}` | — | Деталі роботи |
| `POST` | `/api/v1/artworks` | ✅ | Створити |
| `PUT` | `/api/v1/artworks/{id}` | ✅ | Оновити |
| `DELETE` | `/api/v1/artworks/{id}` | ✅ | Видалити |
| `POST` | `/api/v1/artworks/bulk` | ✅ | Bulk-операції |
| `GET` | `/api/v1/artists` | — | Список митців |
| `GET` | `/api/v1/artists/{id}` | — | Профіль митця |
| `GET` | `/api/v1/orders` | ✅ | Замовлення користувача |
| `POST` | `/api/v1/orders` | ✅ | Створити замовлення |
| `GET` | `/api/v1/orders/{id}` | ✅ | Деталі замовлення |
| `POST` | `/api/v1/uploads` | ✅ | Завантажити файл |
| `GET` | `/api/v1/blog` | — | Список постів |
| `GET` | `/api/v1/blog/{slug}` | — | Пост за slug |
| `GET` | `/api/v1/events` | — | Події |
| `GET` | `/api/v1/dashboard/analytics` | ✅ | Аналітика митця |
| `GET` | `/api/v1/messenger/conversations` | ✅ | Чати |
| `POST` | `/api/v1/messenger/conversations/{id}/messages` | ✅ | Надіслати повідомлення |
| `GET` | `/health` | — | Liveness probe |
| `GET` | `/ready` | — | Readiness probe |

### Приклад handler

```go
// internal/handler/artwork.go
func (h *Handler) ListArtworks(w http.ResponseWriter, r *http.Request) {
	filters := model.ArtworkFilters{
		Category:  queryParam(r, "category"),
		MinPrice:  queryParamInt64(r, "min_price"),
		MaxPrice:  queryParamInt64(r, "max_price"),
		Search:    queryParam(r, "search"),
		SortBy:    queryParamOr(r, "sort_by", "created_at"),
		SortOrder: queryParamOr(r, "sort_order", "desc"),
		Page:      queryParamIntOr(r, "page", 1),
		PerPage:   queryParamIntOr(r, "per_page", 24),
	}

	if err := h.validator.Struct(filters); err != nil {
		response.ValidationError(w, err)
		return
	}

	result, err := h.artworkService.List(r.Context(), filters)
	if err != nil {
		response.ServerError(w, err)
		return
	}

	response.JSON(w, http.StatusOK, result)
}
```

## Graceful Shutdown

```go
// internal/server/server.go
package server

import (
	"context"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"
)

type Server struct {
	httpServer *http.Server
	cfg        *config.Config
	handler    *handler.Handler
	middleware *middleware.Middleware
}

func (s *Server) Run() error {
	s.httpServer = &http.Server{
		Addr:         fmt.Sprintf(":%d", s.cfg.Port),
		Handler:      s.routes(),
		ReadTimeout:  s.cfg.ReadTimeout,
		WriteTimeout: s.cfg.WriteTimeout,
		IdleTimeout:  s.cfg.IdleTimeout,
	}

	// Канал для помилок сервера
	serverErr := make(chan error, 1)
	go func() {
		slog.Info("server starting", "port", s.cfg.Port)
		serverErr <- s.httpServer.ListenAndServe()
	}()

	// Канал для сигналів ОС
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM, syscall.SIGHUP)

	select {
	case err := <-serverErr:
		return fmt.Errorf("server error: %w", err)

	case sig := <-quit:
		slog.Info("shutdown signal received", "signal", sig)

		ctx, cancel := context.WithTimeout(context.Background(), s.cfg.ShutdownTimeout)
		defer cancel()

		// Graceful shutdown — дочекатись завершення активних з'єднань
		if err := s.httpServer.Shutdown(ctx); err != nil {
			// Примусове закриття якщо timeout
			s.httpServer.Close()
			return fmt.Errorf("forced shutdown: %w", err)
		}

		slog.Info("server stopped gracefully")
	}

	return nil
}
```

## Health Checks

```go
// internal/handler/health.go
func (h *Handler) Health(w http.ResponseWriter, r *http.Request) {
	response.JSON(w, http.StatusOK, map[string]string{
		"status":  "alive",
		"version": h.cfg.Version,
	})
}

func (h *Handler) Ready(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
	defer cancel()

	checks := map[string]string{}

	if err := h.db.PingContext(ctx); err != nil {
		checks["database"] = "unhealthy: " + err.Error()
	} else {
		checks["database"] = "healthy"
	}

	if err := h.redis.Ping(ctx).Err(); err != nil {
		checks["redis"] = "unhealthy: " + err.Error()
	} else {
		checks["redis"] = "healthy"
	}

	for _, v := range checks {
		if strings.HasPrefix(v, "unhealthy") {
			response.JSON(w, http.StatusServiceUnavailable, map[string]interface{}{
				"status": "not ready",
				"checks": checks,
			})
			return
		}
	}

	response.JSON(w, http.StatusOK, map[string]interface{}{
		"status": "ready",
		"checks": checks,
	})
}
```

## Rate Limiting

```go
// internal/middleware/ratelimit.go
package middleware

import (
	"net/http"
	"sync"
	"golang.org/x/time/rate"
)

type ipLimiter struct {
	limiters map[string]*rate.Limiter
	mu       sync.RWMutex
	rps      rate.Limit
	burst    int
}

func (m *Middleware) RateLimit(next http.Handler) http.Handler {
	limiter := &ipLimiter{
		limiters: make(map[string]*rate.Limiter),
		rps:      rate.Limit(m.cfg.RateLimitRPS),
		burst:    m.cfg.RateLimitBurst,
	}

	// Cleanup stale entries кожні 10 хв
	go func() {
		for range time.Tick(10 * time.Minute) {
			limiter.mu.Lock()
			limiter.limiters = make(map[string]*rate.Limiter)
			limiter.mu.Unlock()
		}
	}()

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ip := r.RemoteAddr

		limiter.mu.Lock()
		l, exists := limiter.limiters[ip]
		if !exists {
			l = rate.NewLimiter(limiter.rps, limiter.burst)
			limiter.limiters[ip] = l
		}
		limiter.mu.Unlock()

		if !l.Allow() {
			w.Header().Set("Retry-After", "1")
			http.Error(w, `{"error":"rate limit exceeded"}`, http.StatusTooManyRequests)
			return
		}

		next.ServeHTTP(w, r)
	})
}
```

## Логування та Трейсинг

```go
// internal/middleware/logger.go
package middleware

import (
	"log/slog"
	"net/http"
	"time"
)

func (m *Middleware) Logger(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		ww := &responseWriter{ResponseWriter: w, status: 200}

		next.ServeHTTP(ww, r)

		slog.Info("request",
			"method", r.Method,
			"path", r.URL.Path,
			"status", ww.status,
			"duration_ms", time.Since(start).Milliseconds(),
			"ip", r.RemoteAddr,
			"request_id", r.Header.Get("X-Request-ID"),
			"user_agent", r.UserAgent(),
		)
	})
}

type responseWriter struct {
	http.ResponseWriter
	status int
}

func (rw *responseWriter) WriteHeader(code int) {
	rw.status = code
	rw.ResponseWriter.WriteHeader(code)
}
```

## Тестування

```go
// internal/handler/artwork_test.go
package handler_test

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestListArtworks(t *testing.T) {
	srv := setupTestServer(t)

	t.Run("returns paginated artworks", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/v1/artworks?page=1&per_page=10", nil)
		rec := httptest.NewRecorder()

		srv.ServeHTTP(rec, req)

		assert.Equal(t, http.StatusOK, rec.Code)

		var resp PaginatedResponse
		err := json.NewDecoder(rec.Body).Decode(&resp)
		require.NoError(t, err)
		assert.LessOrEqual(t, len(resp.Data), 10)
	})

	t.Run("filters by category", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/v1/artworks?category=painting", nil)
		rec := httptest.NewRecorder()

		srv.ServeHTTP(rec, req)
		assert.Equal(t, http.StatusOK, rec.Code)
	})
}

func TestCreateArtwork_Unauthorized(t *testing.T) {
	srv := setupTestServer(t)

	req := httptest.NewRequest(http.MethodPost, "/api/v1/artworks", nil)
	rec := httptest.NewRecorder()

	srv.ServeHTTP(rec, req)
	assert.Equal(t, http.StatusUnauthorized, rec.Code)
}
```

### Makefile

```makefile
.PHONY: test build run migrate lint

test:
	go test -v -race -coverprofile=coverage.out ./...

test-integration:
	DATABASE_URL=postgres://test:test@localhost:5432/mystetstvo_test go test -v -tags=integration ./...

build:
	CGO_ENABLED=0 go build -ldflags="-s -w" -o bin/api cmd/api/main.go

run:
	go run cmd/api/main.go

migrate-up:
	migrate -path migrations -database "$(DATABASE_URL)" up

migrate-down:
	migrate -path migrations -database "$(DATABASE_URL)" down 1

lint:
	golangci-lint run ./...

docker-build:
	docker build -t mystetstvo-api .

docker-run:
	docker-compose up -d
```

## Docker та CI/CD

### Multi-stage Dockerfile

```dockerfile
# Build stage
FROM golang:1.22-alpine AS builder
RUN apk add --no-cache git ca-certificates
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w -X main.version=$(git describe --tags)" -o /api cmd/api/main.go

# Runtime stage
FROM alpine:3.19
RUN apk add --no-cache ca-certificates tzdata
RUN adduser -D -g '' appuser
COPY --from=builder /api /usr/local/bin/api
USER appuser
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1
CMD ["api"]
```

### Docker Compose (production-like)

```yaml
version: "3.9"
services:
  api:
    build: .
    ports:
      - "8080:8080"
    environment:
      DATABASE_URL: postgres://mystetstvo:${DB_PASSWORD}@db:5432/mystetstvo?sslmode=disable
      REDIS_URL: redis://redis:6379
      JWT_SECRET: ${JWT_SECRET}
      S3_ENDPOINT: http://minio:9000
      S3_ACCESS_KEY: ${MINIO_ACCESS_KEY}
      S3_SECRET_KEY: ${MINIO_SECRET_KEY}
      CORS_ORIGINS: http://localhost:5173,https://mystetstvo.com
      APP_ENV: production
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_started
    restart: unless-stopped
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: "1"
          memory: 512M

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: mystetstvo
      POSTGRES_USER: mystetstvo
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U mystetstvo"]
      interval: 5s
      timeout: 3s
      retries: 5
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    command: redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru
    volumes:
      - redisdata:/data
    restart: unless-stopped

  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: ${MINIO_ACCESS_KEY}
      MINIO_ROOT_PASSWORD: ${MINIO_SECRET_KEY}
    volumes:
      - miniodata:/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./certs:/etc/nginx/certs:ro
    depends_on:
      - api
    restart: unless-stopped

volumes:
  pgdata:
  redisdata:
  miniodata:
```

### GitHub Actions CI

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_DB: test
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v5
        with:
          go-version: "1.22"

      - name: Lint
        uses: golangci/golangci-lint-action@v4

      - name: Test
        run: make test
        env:
          DATABASE_URL: postgres://test:test@localhost:5432/test?sslmode=disable

      - name: Build
        run: make build

  docker:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3
      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - uses: docker/build-push-action@v5
        with:
          push: true
          tags: ghcr.io/${{ github.repository }}:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

## Kubernetes

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mystetstvo-api
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 1
      maxSurge: 1
  selector:
    matchLabels:
      app: mystetstvo-api
  template:
    metadata:
      labels:
        app: mystetstvo-api
    spec:
      containers:
        - name: api
          image: ghcr.io/your-org/mystetstvo-api:latest
          ports:
            - containerPort: 8080
          envFrom:
            - secretRef:
                name: mystetstvo-secrets
          resources:
            requests:
              cpu: 100m
              memory: 128Mi
            limits:
              cpu: 500m
              memory: 512Mi
          livenessProbe:
            httpGet:
              path: /health
              port: 8080
            initialDelaySeconds: 5
            periodSeconds: 15
          readinessProbe:
            httpGet:
              path: /ready
              port: 8080
            initialDelaySeconds: 5
            periodSeconds: 10
          lifecycle:
            preStop:
              exec:
                command: ["/bin/sh", "-c", "sleep 5"]
---
apiVersion: v1
kind: Service
metadata:
  name: mystetstvo-api
spec:
  selector:
    app: mystetstvo-api
  ports:
    - port: 80
      targetPort: 8080
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: mystetstvo-api
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: mystetstvo-api
  minReplicas: 3
  maxReplicas: 20
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
```

## Моніторинг

### Prometheus метрики

```go
// internal/middleware/metrics.go
package middleware

import (
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
)

var (
	httpRequestsTotal = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Name: "http_requests_total",
			Help: "Total HTTP requests",
		},
		[]string{"method", "path", "status"},
	)

	httpRequestDuration = promauto.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "http_request_duration_seconds",
			Help:    "HTTP request duration",
			Buckets: []float64{.005, .01, .025, .05, .1, .25, .5, 1, 2.5, 5},
		},
		[]string{"method", "path"},
	)

	dbQueryDuration = promauto.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "db_query_duration_seconds",
			Help:    "Database query duration",
			Buckets: []float64{.001, .005, .01, .025, .05, .1, .25, .5, 1},
		},
		[]string{"query"},
	)
)
```

## Підключення до Frontend

### API Client (`src/lib/api.ts`)

```typescript
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token: string | null) {
    this.token = token;
    token ? localStorage.setItem('auth_token', token) : localStorage.removeItem('auth_token');
  }

  private async request<T>(endpoint: string, init: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
    };

    const res = await fetch(`${API_BASE}/api/v1${endpoint}`, { ...init, headers });

    if (res.status === 401) {
      // Спробувати refresh token
      const refreshed = await this.refreshToken();
      if (refreshed) {
        headers.Authorization = `Bearer ${this.token}`;
        const retry = await fetch(`${API_BASE}/api/v1${endpoint}`, { ...init, headers });
        if (!retry.ok) throw new ApiError(retry.status, await retry.text());
        return retry.json();
      }
      throw new ApiError(401, 'Unauthorized');
    }

    if (!res.ok) throw new ApiError(res.status, await res.text());
    return res.json();
  }

  private async refreshToken(): Promise<boolean> {
    try {
      const refresh = localStorage.getItem('refresh_token');
      if (!refresh) return false;
      const data = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refresh }),
      }).then(r => r.json());
      this.setToken(data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      return true;
    } catch {
      return false;
    }
  }

  // Auth
  login = (email: string, password: string) =>
    this.request<TokenPair>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });

  register = (data: RegisterData) =>
    this.request<TokenPair>('/auth/register', { method: 'POST', body: JSON.stringify(data) });

  me = () => this.request<User>('/auth/me');

  // Artworks
  listArtworks = (params?: Record<string, string>) =>
    this.request<Paginated<Artwork>>(`/artworks?${new URLSearchParams(params)}`);

  getArtwork = (id: string) => this.request<Artwork>(`/artworks/${id}`);

  createArtwork = (data: CreateArtwork) =>
    this.request<Artwork>('/artworks', { method: 'POST', body: JSON.stringify(data) });

  // Orders
  createOrder = (data: CreateOrder) =>
    this.request<Order>('/orders', { method: 'POST', body: JSON.stringify(data) });

  // Upload
  upload = async (file: File) => {
    const form = new FormData();
    form.append('file', file);
    const res = await fetch(`${API_BASE}/api/v1/uploads`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.token}` },
      body: form,
    });
    return res.json() as Promise<{ url: string }>;
  };

  // Analytics
  getAnalytics = (period: string) => this.request<Analytics>(`/dashboard/analytics?period=${period}`);
}

export const api = new ApiClient();
```

### Env змінні

```env
# .env.local
VITE_API_URL=http://localhost:8080

# .env.production
VITE_API_URL=https://api.mystetstvo.com
```
