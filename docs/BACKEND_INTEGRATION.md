# Інтеграція Rust Backend з Мистецтво Frontend

Цей документ описує, як підключити бекенд на мові Rust до цього React/Vite фронтенду.

## Зміст

1. [Архітектура](#архітектура)
2. [Вимоги](#вимоги)
3. [Налаштування Rust Backend](#налаштування-rust-backend)
4. [API Endpoints](#api-endpoints)
5. [Підключення до Frontend](#підключення-до-frontend)
6. [Автентифікація](#автентифікація)
7. [CORS налаштування](#cors-налаштування)
8. [Розгортання](#розгортання)

---

## Архітектура

```
┌─────────────────┐     HTTP/REST     ┌─────────────────┐
│                 │ ◄───────────────► │                 │
│  React Frontend │                   │   Rust Backend  │
│  (Vite + TS)    │                   │  (Axum/Actix)   │
│                 │                   │                 │
└─────────────────┘                   └────────┬────────┘
                                               │
                                               ▼
                                      ┌─────────────────┐
                                      │    PostgreSQL   │
                                      │    (Database)   │
                                      └─────────────────┘
```

## Вимоги

### Rust Backend
- Rust 1.75+ 
- Рекомендовані фреймворки:
  - **Axum** (рекомендовано) - сучасний, типобезпечний
  - **Actix-web** - висока продуктивність
  - **Rocket** - простий у використанні

### Залежності Cargo.toml

```toml
[dependencies]
axum = "0.7"
tokio = { version = "1", features = ["full"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
sqlx = { version = "0.7", features = ["runtime-tokio", "postgres", "uuid", "chrono"] }
tower-http = { version = "0.5", features = ["cors", "trace"] }
jsonwebtoken = "9"
bcrypt = "0.15"
uuid = { version = "1", features = ["v4", "serde"] }
chrono = { version = "0.4", features = ["serde"] }
dotenvy = "0.15"
tracing = "0.1"
tracing-subscriber = "0.3"
```

---

## Налаштування Rust Backend

### Базова структура проекту

```
rust-backend/
├── Cargo.toml
├── .env
├── src/
│   ├── main.rs
│   ├── config.rs
│   ├── routes/
│   │   ├── mod.rs
│   │   ├── auth.rs
│   │   ├── artworks.rs
│   │   ├── artists.rs
│   │   ├── orders.rs
│   │   └── blog.rs
│   ├── models/
│   │   ├── mod.rs
│   │   ├── user.rs
│   │   ├── artwork.rs
│   │   └── order.rs
│   ├── handlers/
│   ├── middleware/
│   │   └── auth.rs
│   └── db/
│       ├── mod.rs
│       └── migrations/
└── tests/
```

### Приклад main.rs (Axum)

```rust
use axum::{
    routing::{get, post, put, delete},
    Router,
};
use tower_http::cors::{CorsLayer, Any};
use std::net::SocketAddr;

mod config;
mod routes;
mod models;
mod handlers;
mod middleware;
mod db;

#[tokio::main]
async fn main() {
    // Ініціалізація логування
    tracing_subscriber::init();
    
    // Завантаження конфігурації
    dotenvy::dotenv().ok();
    
    // Підключення до бази даних
    let pool = db::create_pool().await;
    
    // CORS для фронтенду
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);
    
    // Роутер
    let app = Router::new()
        // Автентифікація
        .route("/api/auth/register", post(handlers::auth::register))
        .route("/api/auth/login", post(handlers::auth::login))
        .route("/api/auth/logout", post(handlers::auth::logout))
        .route("/api/auth/me", get(handlers::auth::me))
        
        // Роботи (artworks)
        .route("/api/artworks", get(handlers::artworks::list))
        .route("/api/artworks", post(handlers::artworks::create))
        .route("/api/artworks/:id", get(handlers::artworks::get_one))
        .route("/api/artworks/:id", put(handlers::artworks::update))
        .route("/api/artworks/:id", delete(handlers::artworks::delete))
        
        // Митці
        .route("/api/artists", get(handlers::artists::list))
        .route("/api/artists/:id", get(handlers::artists::get_one))
        
        // Замовлення
        .route("/api/orders", get(handlers::orders::list))
        .route("/api/orders", post(handlers::orders::create))
        .route("/api/orders/:id", get(handlers::orders::get_one))
        
        // Блог
        .route("/api/blog", get(handlers::blog::list))
        .route("/api/blog/:slug", get(handlers::blog::get_one))
        
        // AI переклад
        .route("/api/ai/translate", post(handlers::ai::translate))
        
        .layer(cors)
        .with_state(pool);
    
    let addr = SocketAddr::from(([0, 0, 0, 0], 8080));
    tracing::info!("Сервер запущено на {}", addr);
    
    axum::Server::bind(&addr)
        .serve(app.into_make_service())
        .await
        .unwrap();
}
```

---

## API Endpoints

### Автентифікація

| Method | Endpoint | Опис |
|--------|----------|------|
| POST | `/api/auth/register` | Реєстрація користувача |
| POST | `/api/auth/login` | Вхід (повертає JWT) |
| POST | `/api/auth/logout` | Вихід |
| GET | `/api/auth/me` | Поточний користувач |
| POST | `/api/auth/refresh` | Оновлення токена |

### Роботи (Artworks)

| Method | Endpoint | Опис |
|--------|----------|------|
| GET | `/api/artworks` | Список робіт (з пагінацією) |
| GET | `/api/artworks/:id` | Деталі роботи |
| POST | `/api/artworks` | Створити роботу (auth) |
| PUT | `/api/artworks/:id` | Оновити роботу (auth) |
| DELETE | `/api/artworks/:id` | Видалити роботу (auth) |
| POST | `/api/artworks/bulk` | Bulk операції (auth) |

### Приклад моделі (Rust)

```rust
// src/models/artwork.rs
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;
use chrono::{DateTime, Utc};

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Artwork {
    pub id: Uuid,
    pub title: String,
    pub description: Option<String>,
    pub price: i64,  // в копійках
    pub currency: String,
    pub artist_id: Uuid,
    pub category: String,
    pub status: ArtworkStatus,
    pub images: Vec<String>,
    pub translations: Option<serde_json::Value>,
    pub is_promoted: bool,
    pub promoted_until: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "artwork_status", rename_all = "snake_case")]
pub enum ArtworkStatus {
    Draft,
    Active,
    Sold,
    Archived,
}

#[derive(Debug, Deserialize)]
pub struct CreateArtwork {
    pub title: String,
    pub description: Option<String>,
    pub price: i64,
    pub category: String,
    pub images: Vec<String>,
}

#[derive(Debug, Deserialize)]
pub struct BulkOperation {
    pub ids: Vec<Uuid>,
    pub action: BulkAction,
}

#[derive(Debug, Deserialize)]
#[serde(tag = "type")]
pub enum BulkAction {
    Translate { languages: Vec<String> },
    Promote { days: i32 },
    Archive,
    Delete,
}
```

---

## Підключення до Frontend

### 1. Створити API клієнт

```typescript
// src/lib/api.ts
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'API Error');
    }

    return response.json();
  }

  // Автентифікація
  auth = {
    login: (email: string, password: string) =>
      this.request<{ token: string; user: User }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    
    register: (data: RegisterData) =>
      this.request<{ token: string; user: User }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    
    me: () => this.request<User>('/api/auth/me'),
  };

  // Роботи
  artworks = {
    list: (params?: ArtworkFilters) =>
      this.request<PaginatedResponse<Artwork>>(
        `/api/artworks?${new URLSearchParams(params as any)}`
      ),
    
    get: (id: string) =>
      this.request<Artwork>(`/api/artworks/${id}`),
    
    create: (data: CreateArtwork) =>
      this.request<Artwork>('/api/artworks', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    
    update: (id: string, data: Partial<Artwork>) =>
      this.request<Artwork>(`/api/artworks/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    
    delete: (id: string) =>
      this.request<void>(`/api/artworks/${id}`, { method: 'DELETE' }),
    
    bulk: (operation: BulkOperation) =>
      this.request<BulkResult>('/api/artworks/bulk', {
        method: 'POST',
        body: JSON.stringify(operation),
      }),
  };

  // AI
  ai = {
    translate: (text: string, targetLanguages: string[]) =>
      this.request<TranslationResult>('/api/ai/translate', {
        method: 'POST',
        body: JSON.stringify({ text, target_languages: targetLanguages }),
      }),
  };
}

export const api = new ApiClient(API_BASE_URL);
```

### 2. Додати змінну середовища

```env
# .env.local (для розробки)
VITE_API_URL=http://localhost:8080

# .env.production
VITE_API_URL=https://api.mystetstvo.com
```

### 3. Використання з React Query

```typescript
// src/hooks/useArtworks.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useArtworks(filters?: ArtworkFilters) {
  return useQuery({
    queryKey: ['artworks', filters],
    queryFn: () => api.artworks.list(filters),
  });
}

export function useCreateArtwork() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.artworks.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['artworks'] });
    },
  });
}

export function useBulkOperation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.artworks.bulk,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['artworks'] });
    },
  });
}
```

---

## Автентифікація

### JWT Token Structure

```rust
// src/middleware/auth.rs
use jsonwebtoken::{encode, decode, Header, Validation, EncodingKey, DecodingKey};

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: Uuid,        // user_id
    pub email: String,
    pub role: UserRole,
    pub exp: usize,       // expiration timestamp
    pub iat: usize,       // issued at
}

pub fn create_token(user: &User) -> Result<String, Error> {
    let expiration = chrono::Utc::now()
        .checked_add_signed(chrono::Duration::hours(24))
        .unwrap()
        .timestamp() as usize;
    
    let claims = Claims {
        sub: user.id,
        email: user.email.clone(),
        role: user.role.clone(),
        exp: expiration,
        iat: chrono::Utc::now().timestamp() as usize,
    };
    
    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(std::env::var("JWT_SECRET")?.as_bytes()),
    )
}
```

---

## CORS налаштування

```rust
use tower_http::cors::{CorsLayer, AllowOrigin};
use http::HeaderValue;

let cors = CorsLayer::new()
    .allow_origin(AllowOrigin::list([
        "http://localhost:5173".parse::<HeaderValue>().unwrap(),
        "http://localhost:8080".parse::<HeaderValue>().unwrap(),
        "https://mystetstvo.com".parse::<HeaderValue>().unwrap(),
    ]))
    .allow_methods([Method::GET, Method::POST, Method::PUT, Method::DELETE])
    .allow_headers([
        header::CONTENT_TYPE,
        header::AUTHORIZATION,
        header::ACCEPT,
    ])
    .allow_credentials(true);
```

---

## Розгортання

### Docker

```dockerfile
# Dockerfile
FROM rust:1.75 as builder
WORKDIR /app
COPY . .
RUN cargo build --release

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y libssl3 ca-certificates && rm -rf /var/lib/apt/lists/*
COPY --from=builder /app/target/release/mystetstvo-api /usr/local/bin/
EXPOSE 8080
CMD ["mystetstvo-api"]
```

### Docker Compose

```yaml
version: '3.8'
services:
  api:
    build: ./rust-backend
    ports:
      - "8080:8080"
    environment:
      - DATABASE_URL=postgres://user:pass@db:5432/mystetstvo
      - JWT_SECRET=${JWT_SECRET}
      - RUST_LOG=info
    depends_on:
      - db
  
  db:
    image: postgres:16
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: mystetstvo
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

---

## Чек-лист інтеграції

- [ ] Налаштувати Rust проект з Axum/Actix
- [ ] Створити PostgreSQL схему бази даних
- [ ] Реалізувати JWT автентифікацію
- [ ] Створити CRUD ендпоінти для робіт, митців, замовлень
- [ ] Налаштувати CORS для фронтенду
- [ ] Створити `src/lib/api.ts` на фронтенді
- [ ] Додати `VITE_API_URL` змінну
- [ ] Підключити React Query хуки
- [ ] Налаштувати Docker для деплою
- [ ] Додати тести (Rust: `cargo test`, Frontend: Vitest)

---

## Корисні посилання

- [Axum documentation](https://docs.rs/axum/latest/axum/)
- [SQLx documentation](https://docs.rs/sqlx/latest/sqlx/)
- [JWT in Rust](https://docs.rs/jsonwebtoken/latest/jsonwebtoken/)
- [React Query](https://tanstack.com/query/latest)
