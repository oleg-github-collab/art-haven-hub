# Інтеграція з Elixir/Phoenix Backend — Продакшн-гайд

Повна документація з побудови відмовостійкого бекенду на Elixir/Phoenix для платформи Мистецтво. Elixir побудований на Erlang VM (BEAM), що забезпечує нативну відмовостійкість, конкурентність та hot code reloading.

## Зміст

1. [Чому Elixir](#чому-elixir)
2. [Архітектура](#архітектура)
3. [Технологічний стек](#технологічний-стек)
4. [Структура проекту](#структура-проекту)
5. [Конфігурація](#конфігурація)
6. [Схема бази даних (Ecto)](#схема-бази-даних)
7. [Маршрутизація та Pipeline](#маршрутизація)
8. [Контролери](#контролери)
9. [Автентифікація (Guardian + JWT)](#автентифікація)
10. [Контексти (бізнес-логіка)](#контексти)
11. [Real-time з Phoenix Channels](#real-time)
12. [Обробка файлів](#обробка-файлів)
13. [Background Jobs (Oban)](#background-jobs)
14. [Supervision Trees та відмовостійкість](#supervision-trees)
15. [Rate Limiting (Hammer)](#rate-limiting)
16. [Телеметрія та моніторинг](#телеметрія)
17. [Тестування](#тестування)
18. [Docker та Release](#docker-та-release)
19. [Kubernetes Deployment](#kubernetes)
20. [Підключення до Frontend](#підключення-до-frontend)

---

## Чому Elixir

| Характеристика | Деталі |
|---|---|
| **BEAM VM** | Мільйони легких процесів, preemptive scheduling |
| **Supervision trees** | Автоматичний перезапуск при збоях — "let it crash" |
| **Hot code reloading** | Оновлення без downtime |
| **Phoenix Channels** | Вбудований WebSocket для real-time месенджера |
| **Конкурентність** | Кожен HTTP запит — окремий процес, ізольований від інших |
| **Oban** | Надійні background jobs з retries та CRON |
| **Telemetry** | Вбудована система метрик на рівні VM |

## Архітектура

```
                    ┌──────────────┐
                    │   Nginx /    │
                    │   Caddy      │
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
        ┌─────▼─────┐ ┌───▼────┐ ┌────▼─────┐
        │  Phoenix  │ │Phoenix │ │ Phoenix  │
        │  Node 1   │ │Node 2  │ │ Node 3   │
        │  (BEAM)   │ │(BEAM)  │ │ (BEAM)   │
        └─────┬─────┘ └───┬────┘ └────┬─────┘
              │     libcluster     │
              │  (auto-discovery)  │
              └────────────┼────────────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
        ┌─────▼─────┐ ┌───▼────┐ ┌────▼─────┐
        │ PostgreSQL│ │ Redis  │ │   S3 /   │
        │ + Ecto    │ │(PubSub)│ │  MinIO   │
        └───────────┘ └────────┘ └──────────┘
```

### Ключова перевага BEAM

На відміну від Go, де один goroutine panic може вбити весь процес, в Elixir кожен запит працює в ізольованому процесі. Якщо один процес впаде — supervisor автоматично перезапустить його, решта системи продовжує працювати без переривань.

## Технологічний стек

| Компонент | Бібліотека | Версія |
|---|---|---|
| Web Framework | `Phoenix` | 1.7+ |
| ORM | `Ecto` | 3.11+ |
| Auth | `Guardian` + `Bcrypt` | Latest |
| Background Jobs | `Oban` | 2.17+ |
| File Upload | `Waffle` | Latest |
| Rate Limiting | `Hammer` | Latest |
| Telemetry | `Telemetry` + `PromEx` | Latest |
| HTTP Client | `Req` | Latest |
| Testing | `ExUnit` (built-in) | — |
| JSON | `Jason` | Latest |
| CORS | `CorsPlug` | Latest |
| Clustering | `libcluster` | Latest |

## Структура проекту

```
mystetstvo/
├── config/
│   ├── config.exs          # Базова конфігурація
│   ├── dev.exs              # Development
│   ├── prod.exs             # Production
│   ├── runtime.exs          # Runtime env vars
│   └── test.exs             # Test
├── lib/
│   ├── mystetstvo/           # Бізнес-логіка (контексти)
│   │   ├── application.ex    # Supervision tree
│   │   ├── repo.ex           # Ecto Repo
│   │   ├── accounts/         # Контекст: користувачі
│   │   │   ├── accounts.ex   # Публічний API контексту
│   │   │   ├── user.ex       # Ecto schema
│   │   │   └── user_role.ex  # Ролі (окрема таблиця!)
│   │   ├── gallery/          # Контекст: роботи
│   │   │   ├── gallery.ex
│   │   │   ├── artwork.ex
│   │   │   └── artwork_query.ex
│   │   ├── commerce/         # Контекст: замовлення
│   │   │   ├── commerce.ex
│   │   │   ├── order.ex
│   │   │   └── order_item.ex
│   │   ├── blog/             # Контекст: блог
│   │   │   ├── blog.ex
│   │   │   └── post.ex
│   │   ├── messenger/        # Контекст: чат
│   │   │   ├── messenger.ex
│   │   │   ├── conversation.ex
│   │   │   └── message.ex
│   │   └── analytics/        # Контекст: аналітика
│   │       └── analytics.ex
│   └── mystetstvo_web/       # Web layer
│       ├── endpoint.ex       # Phoenix Endpoint
│       ├── router.ex         # Маршрутизація
│       ├── telemetry.ex      # Телеметрія
│       ├── plugs/
│       │   ├── auth.ex       # JWT plug
│       │   └── rate_limit.ex # Rate limiting plug
│       ├── controllers/
│       │   ├── auth_controller.ex
│       │   ├── artwork_controller.ex
│       │   ├── artist_controller.ex
│       │   ├── order_controller.ex
│       │   ├── upload_controller.ex
│       │   ├── blog_controller.ex
│       │   ├── health_controller.ex
│       │   └── fallback_controller.ex
│       ├── channels/
│       │   ├── user_socket.ex
│       │   ├── messenger_channel.ex
│       │   └── notification_channel.ex
│       └── views/
│           └── error_json.ex
├── priv/
│   └── repo/
│       └── migrations/
├── test/
│   ├── mystetstvo/
│   └── mystetstvo_web/
├── mix.exs
├── Dockerfile
├── docker-compose.yml
└── .formatter.exs
```

## Конфігурація

### mix.exs

```elixir
defmodule Mystetstvo.MixProject do
  use Mix.Project

  def project do
    [
      app: :mystetstvo,
      version: "1.0.0",
      elixir: "~> 1.16",
      start_permanent: Mix.env() == :prod,
      aliases: aliases(),
      deps: deps()
    ]
  end

  def application do
    [
      mod: {Mystetstvo.Application, []},
      extra_applications: [:logger, :runtime_tools, :os_mon]
    ]
  end

  defp deps do
    [
      # Web
      {:phoenix, "~> 1.7"},
      {:phoenix_ecto, "~> 4.5"},
      {:ecto_sql, "~> 3.11"},
      {:postgrex, ">= 0.0.0"},
      {:jason, "~> 1.4"},
      {:plug_cowboy, "~> 2.7"},
      {:cors_plug, "~> 3.0"},

      # Auth
      {:guardian, "~> 2.3"},
      {:bcrypt_elixir, "~> 3.1"},

      # Background jobs
      {:oban, "~> 2.17"},

      # File upload
      {:waffle, "~> 1.1"},
      {:waffle_ecto, "~> 0.0"},
      {:ex_aws, "~> 2.5"},
      {:ex_aws_s3, "~> 2.5"},

      # Rate limiting
      {:hammer, "~> 6.2"},
      {:hammer_plug, "~> 3.0"},

      # Monitoring
      {:prom_ex, "~> 1.9"},
      {:telemetry_metrics, "~> 0.6"},
      {:telemetry_poller, "~> 1.0"},

      # Clustering
      {:libcluster, "~> 3.3"},

      # HTTP client
      {:req, "~> 0.5"},

      # Dev/Test
      {:credo, "~> 1.7", only: [:dev, :test]},
      {:dialyxir, "~> 1.4", only: [:dev, :test], runtime: false},
      {:ex_machina, "~> 2.7", only: :test},
      {:mox, "~> 1.1", only: :test}
    ]
  end

  defp aliases do
    [
      setup: ["deps.get", "ecto.setup"],
      "ecto.setup": ["ecto.create", "ecto.migrate", "run priv/repo/seeds.exs"],
      "ecto.reset": ["ecto.drop", "ecto.setup"],
      test: ["ecto.create --quiet", "ecto.migrate --quiet", "test"]
    ]
  end
end
```

### Runtime Config

```elixir
# config/runtime.exs
import Config

if config_env() == :prod do
  database_url =
    System.get_env("DATABASE_URL") ||
      raise "DATABASE_URL not set"

  config :mystetstvo, Mystetstvo.Repo,
    url: database_url,
    pool_size: String.to_integer(System.get_env("POOL_SIZE") || "20"),
    ssl: true,
    ssl_opts: [verify: :verify_none]

  secret_key_base =
    System.get_env("SECRET_KEY_BASE") ||
      raise "SECRET_KEY_BASE not set"

  port = String.to_integer(System.get_env("PORT") || "4000")

  config :mystetstvo, MystetstvoWeb.Endpoint,
    url: [host: System.get_env("PHX_HOST") || "mystetstvo.com", port: 443, scheme: "https"],
    http: [ip: {0, 0, 0, 0}, port: port],
    secret_key_base: secret_key_base,
    server: true

  config :mystetstvo, Mystetstvo.Guardian,
    secret_key: System.get_env("JWT_SECRET") || raise("JWT_SECRET not set")

  # S3
  config :ex_aws,
    access_key_id: System.get_env("S3_ACCESS_KEY"),
    secret_access_key: System.get_env("S3_SECRET_KEY"),
    region: System.get_env("S3_REGION") || "eu-central-1"

  config :ex_aws, :s3,
    scheme: "https://",
    host: System.get_env("S3_HOST"),
    bucket: System.get_env("S3_BUCKET") || "mystetstvo-uploads"

  # CORS
  config :cors_plug,
    origin: String.split(System.get_env("CORS_ORIGINS") || "", ",")

  # Oban
  config :mystetstvo, Oban,
    repo: Mystetstvo.Repo,
    plugins: [
      {Oban.Plugins.Pruner, max_age: 60 * 60 * 24 * 7},
      {Oban.Plugins.Cron, crontab: [
        {"0 * * * *", Mystetstvo.Workers.AnalyticsAggregator},
        {"0 3 * * *", Mystetstvo.Workers.ExpiredPromotionsCleaner}
      ]}
    ],
    queues: [default: 10, emails: 5, uploads: 3]
end
```

## Схема бази даних

```elixir
# lib/mystetstvo/accounts/user.ex
defmodule Mystetstvo.Accounts.User do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "users" do
    field :email, :string
    field :password_hash, :string
    field :password, :string, virtual: true
    field :name, :string
    field :handle, :string
    field :avatar, :string
    field :bio, :string
    field :location, :string
    field :website, :string
    field :is_verified, :boolean, default: false

    has_many :roles, Mystetstvo.Accounts.UserRole
    has_many :artworks, Mystetstvo.Gallery.Artwork, foreign_key: :artist_id
    has_many :orders, Mystetstvo.Commerce.Order, foreign_key: :buyer_id

    timestamps(type: :utc_datetime)
  end

  def registration_changeset(user, attrs) do
    user
    |> cast(attrs, [:email, :password, :name, :handle])
    |> validate_required([:email, :password, :name, :handle])
    |> validate_format(:email, ~r/^[^\s]+@[^\s]+\.[^\s]+$/)
    |> validate_length(:password, min: 8, max: 100)
    |> validate_length(:name, min: 2, max: 100)
    |> validate_format(:handle, ~r/^[a-z0-9_]{3,30}$/)
    |> unique_constraint(:email)
    |> unique_constraint(:handle)
    |> hash_password()
  end

  def profile_changeset(user, attrs) do
    user
    |> cast(attrs, [:name, :avatar, :bio, :location, :website])
    |> validate_length(:bio, max: 500)
    |> validate_length(:name, min: 2, max: 100)
  end

  defp hash_password(%Ecto.Changeset{valid?: true, changes: %{password: pw}} = cs) do
    change(cs, password_hash: Bcrypt.hash_pwd_salt(pw))
  end
  defp hash_password(cs), do: cs
end

# lib/mystetstvo/accounts/user_role.ex
defmodule Mystetstvo.Accounts.UserRole do
  use Ecto.Schema

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "user_roles" do
    field :role, Ecto.Enum, values: [:user, :artist, :moderator, :admin]
    belongs_to :user, Mystetstvo.Accounts.User
  end
end
```

```elixir
# lib/mystetstvo/gallery/artwork.ex
defmodule Mystetstvo.Gallery.Artwork do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "artworks" do
    field :title, :string
    field :description, :string
    field :price, :integer  # kopecks
    field :currency, :string, default: "UAH"
    field :category, :string
    field :medium, :string
    field :width, :float
    field :height, :float
    field :status, Ecto.Enum, values: [:draft, :active, :sold, :archived], default: :draft
    field :images, {:array, :string}, default: []
    field :translations, :map, default: %{}
    field :tags, {:array, :string}, default: []
    field :view_count, :integer, default: 0
    field :favorite_count, :integer, default: 0
    field :is_promoted, :boolean, default: false
    field :promoted_until, :utc_datetime

    belongs_to :artist, Mystetstvo.Accounts.User

    timestamps(type: :utc_datetime)
  end

  def changeset(artwork, attrs) do
    artwork
    |> cast(attrs, [:title, :description, :price, :currency, :category, :medium,
                     :width, :height, :images, :tags, :status])
    |> validate_required([:title, :price, :category, :images])
    |> validate_number(:price, greater_than: 0)
    |> validate_length(:title, min: 2, max: 200)
    |> validate_length(:description, max: 5000)
    |> validate_inclusion(:currency, ["UAH", "USD", "EUR"])
    |> validate_length(:images, min: 1, max: 20)
  end
end
```

## Маршрутизація

```elixir
# lib/mystetstvo_web/router.ex
defmodule MystetstvoWeb.Router do
  use MystetstvoWeb, :router

  pipeline :api do
    plug :accepts, ["json"]
    plug CORSPlug
    plug Hammer.Plug, [
      rate_limit: {"api", 60_000, 100},  # 100 req/min
      by: :ip
    ]
  end

  pipeline :authenticated do
    plug MystetstvoWeb.Plugs.Auth
  end

  pipeline :admin do
    plug MystetstvoWeb.Plugs.RequireRole, :admin
  end

  # Health
  scope "/", MystetstvoWeb do
    get "/health", HealthController, :health
    get "/ready", HealthController, :ready
  end

  # Public API
  scope "/api/v1", MystetstvoWeb do
    pipe_through :api

    post "/auth/register", AuthController, :register
    post "/auth/login", AuthController, :login
    post "/auth/refresh", AuthController, :refresh
    post "/auth/forgot-password", AuthController, :forgot_password
    post "/auth/reset-password", AuthController, :reset_password

    resources "/artworks", ArtworkController, only: [:index, :show]
    resources "/artists", ArtistController, only: [:index, :show]
    resources "/blog", BlogController, only: [:index, :show], param: "slug"
    get "/events", EventController, :index
  end

  # Protected API
  scope "/api/v1", MystetstvoWeb do
    pipe_through [:api, :authenticated]

    get "/auth/me", AuthController, :me
    post "/auth/logout", AuthController, :logout

    resources "/artworks", ArtworkController, only: [:create, :update, :delete]
    post "/artworks/bulk", ArtworkController, :bulk

    resources "/orders", OrderController, only: [:index, :show, :create]

    post "/uploads", UploadController, :create
    delete "/uploads/:key", UploadController, :delete

    get "/profile", ProfileController, :show
    put "/profile", ProfileController, :update

    get "/dashboard/analytics", AnalyticsController, :index

    scope "/messenger" do
      get "/conversations", MessengerController, :conversations
      get "/conversations/:id/messages", MessengerController, :messages
      post "/conversations/:id/messages", MessengerController, :send_message
    end
  end

  # Admin API
  scope "/api/v1/admin", MystetstvoWeb do
    pipe_through [:api, :authenticated, :admin]

    get "/users", AdminController, :list_users
    put "/users/:id/role", AdminController, :update_role
  end
end
```

## Контролери

```elixir
# lib/mystetstvo_web/controllers/artwork_controller.ex
defmodule MystetstvoWeb.ArtworkController do
  use MystetstvoWeb, :controller
  alias Mystetstvo.Gallery
  action_fallback MystetstvoWeb.FallbackController

  def index(conn, params) do
    filters = %{
      category: params["category"],
      min_price: params["min_price"] && String.to_integer(params["min_price"]),
      max_price: params["max_price"] && String.to_integer(params["max_price"]),
      search: params["search"],
      sort_by: params["sort_by"] || "created_at",
      sort_order: params["sort_order"] || "desc",
      page: String.to_integer(params["page"] || "1"),
      per_page: min(String.to_integer(params["per_page"] || "24"), 100)
    }

    %{entries: artworks, total: total, page: page, per_page: per_page} =
      Gallery.list_artworks(filters)

    conn
    |> put_status(200)
    |> json(%{
      data: artworks,
      meta: %{total: total, page: page, per_page: per_page, total_pages: ceil(total / per_page)}
    })
  end

  def show(conn, %{"id" => id}) do
    with {:ok, artwork} <- Gallery.get_artwork(id) do
      Gallery.increment_view_count(artwork)
      json(conn, %{data: artwork})
    end
  end

  def create(conn, %{"artwork" => artwork_params}) do
    user = conn.assigns.current_user

    with {:ok, artwork} <- Gallery.create_artwork(user, artwork_params) do
      conn |> put_status(:created) |> json(%{data: artwork})
    end
  end

  def bulk(conn, %{"ids" => ids, "action" => action}) do
    user = conn.assigns.current_user

    with {:ok, result} <- Gallery.bulk_action(user, ids, action) do
      json(conn, %{data: result})
    end
  end
end

# lib/mystetstvo_web/controllers/fallback_controller.ex
defmodule MystetstvoWeb.FallbackController do
  use MystetstvoWeb, :controller

  def call(conn, {:error, :not_found}) do
    conn |> put_status(:not_found) |> json(%{error: "not found"})
  end

  def call(conn, {:error, :unauthorized}) do
    conn |> put_status(:unauthorized) |> json(%{error: "unauthorized"})
  end

  def call(conn, {:error, :forbidden}) do
    conn |> put_status(:forbidden) |> json(%{error: "forbidden"})
  end

  def call(conn, {:error, %Ecto.Changeset{} = changeset}) do
    errors = Ecto.Changeset.traverse_errors(changeset, fn {msg, opts} ->
      Regex.replace(~r"%{(\w+)}", msg, fn _, key ->
        opts |> Keyword.get(String.to_existing_atom(key), key) |> to_string()
      end)
    end)

    conn |> put_status(:unprocessable_entity) |> json(%{errors: errors})
  end
end
```

## Автентифікація

```elixir
# lib/mystetstvo/guardian.ex
defmodule Mystetstvo.Guardian do
  use Guardian, otp_app: :mystetstvo

  alias Mystetstvo.Accounts

  def subject_for_token(%{id: id}, _claims), do: {:ok, to_string(id)}
  def subject_for_token(_, _), do: {:error, :invalid_resource}

  def resource_from_claims(%{"sub" => id}) do
    case Accounts.get_user(id) do
      nil -> {:error, :not_found}
      user -> {:ok, user}
    end
  end
  def resource_from_claims(_), do: {:error, :invalid_claims}
end

# lib/mystetstvo_web/plugs/auth.ex
defmodule MystetstvoWeb.Plugs.Auth do
  import Plug.Conn

  def init(opts), do: opts

  def call(conn, _opts) do
    with ["Bearer " <> token] <- get_req_header(conn, "authorization"),
         {:ok, claims} <- Mystetstvo.Guardian.decode_and_verify(token),
         {:ok, user} <- Mystetstvo.Guardian.resource_from_claims(claims) do
      assign(conn, :current_user, user)
    else
      _ ->
        conn
        |> put_status(:unauthorized)
        |> Phoenix.Controller.json(%{error: "unauthorized"})
        |> halt()
    end
  end
end

# lib/mystetstvo_web/plugs/require_role.ex
defmodule MystetstvoWeb.Plugs.RequireRole do
  import Plug.Conn

  def init(role), do: role

  def call(conn, required_role) do
    user = conn.assigns.current_user

    if Mystetstvo.Accounts.has_role?(user.id, required_role) do
      conn
    else
      conn
      |> put_status(:forbidden)
      |> Phoenix.Controller.json(%{error: "forbidden"})
      |> halt()
    end
  end
end
```

## Контексти

```elixir
# lib/mystetstvo/gallery/gallery.ex
defmodule Mystetstvo.Gallery do
  alias Mystetstvo.Repo
  alias Mystetstvo.Gallery.{Artwork, ArtworkQuery}
  import Ecto.Query

  def list_artworks(filters) do
    query =
      Artwork
      |> ArtworkQuery.filter_status(:active)
      |> ArtworkQuery.filter_category(filters.category)
      |> ArtworkQuery.filter_price_range(filters.min_price, filters.max_price)
      |> ArtworkQuery.search(filters.search)
      |> ArtworkQuery.sort(filters.sort_by, filters.sort_order)

    total = Repo.aggregate(query, :count)
    
    entries =
      query
      |> ArtworkQuery.paginate(filters.page, filters.per_page)
      |> Repo.all()
      |> Repo.preload(:artist)

    %{entries: entries, total: total, page: filters.page, per_page: filters.per_page}
  end

  def get_artwork(id) do
    case Repo.get(Artwork, id) |> Repo.preload(:artist) do
      nil -> {:error, :not_found}
      artwork -> {:ok, artwork}
    end
  end

  def create_artwork(user, attrs) do
    %Artwork{artist_id: user.id}
    |> Artwork.changeset(attrs)
    |> Repo.insert()
  end

  def increment_view_count(%Artwork{id: id}) do
    from(a in Artwork, where: a.id == ^id)
    |> Repo.update_all(inc: [view_count: 1])
  end

  def bulk_action(user, ids, action) do
    artworks =
      from(a in Artwork, where: a.id in ^ids and a.artist_id == ^user.id)
      |> Repo.all()

    case action do
      %{"type" => "archive"} ->
        Enum.each(artworks, &(&1 |> Artwork.changeset(%{status: :archived}) |> Repo.update()))
        {:ok, %{updated: length(artworks)}}

      %{"type" => "delete"} ->
        {count, _} = from(a in Artwork, where: a.id in ^ids and a.artist_id == ^user.id) |> Repo.delete_all()
        {:ok, %{deleted: count}}

      %{"type" => "translate", "languages" => langs} ->
        Enum.each(artworks, fn artwork ->
          %{"artwork_id" => artwork.id, "languages" => langs}
          |> Mystetstvo.Workers.TranslateArtwork.new()
          |> Oban.insert()
        end)
        {:ok, %{queued: length(artworks)}}

      _ -> {:error, :invalid_action}
    end
  end
end
```

## Real-time з Phoenix Channels

```elixir
# lib/mystetstvo_web/channels/user_socket.ex
defmodule MystetstvoWeb.UserSocket do
  use Phoenix.Socket

  channel "messenger:*", MystetstvoWeb.MessengerChannel
  channel "notifications:*", MystetstvoWeb.NotificationChannel

  @impl true
  def connect(%{"token" => token}, socket, _connect_info) do
    case Mystetstvo.Guardian.decode_and_verify(token) do
      {:ok, claims} ->
        {:ok, user} = Mystetstvo.Guardian.resource_from_claims(claims)
        {:ok, assign(socket, :current_user, user)}
      _ ->
        :error
    end
  end
  def connect(_, _, _), do: :error

  @impl true
  def id(socket), do: "user_socket:#{socket.assigns.current_user.id}"
end

# lib/mystetstvo_web/channels/messenger_channel.ex
defmodule MystetstvoWeb.MessengerChannel do
  use MystetstvoWeb, :channel

  @impl true
  def join("messenger:" <> conversation_id, _params, socket) do
    user = socket.assigns.current_user

    if Mystetstvo.Messenger.member?(conversation_id, user.id) do
      messages = Mystetstvo.Messenger.recent_messages(conversation_id, 50)
      {:ok, %{messages: messages}, socket |> assign(:conversation_id, conversation_id)}
    else
      {:error, %{reason: "forbidden"}}
    end
  end

  @impl true
  def handle_in("new_message", %{"body" => body}, socket) do
    user = socket.assigns.current_user
    conv_id = socket.assigns.conversation_id

    case Mystetstvo.Messenger.send_message(conv_id, user.id, body) do
      {:ok, message} ->
        broadcast!(socket, "new_message", %{message: message})
        {:noreply, socket}
      {:error, reason} ->
        {:reply, {:error, %{reason: reason}}, socket}
    end
  end

  @impl true
  def handle_in("typing", _, socket) do
    broadcast_from!(socket, "typing", %{user_id: socket.assigns.current_user.id})
    {:noreply, socket}
  end
end
```

### Frontend WebSocket підключення

```typescript
// src/lib/socket.ts
import { Socket } from "phoenix";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";
const WS_URL = API_BASE.replace(/^http/, "ws") + "/socket";

export function createSocket(token: string) {
  const socket = new Socket(WS_URL, { params: { token } });
  socket.connect();
  return socket;
}

export function joinMessenger(socket: Socket, conversationId: string) {
  const channel = socket.channel(`messenger:${conversationId}`, {});

  channel.join()
    .receive("ok", ({ messages }) => console.log("Joined", messages))
    .receive("error", ({ reason }) => console.error("Join failed", reason));

  channel.on("new_message", ({ message }) => {
    // Оновити UI
  });

  channel.on("typing", ({ user_id }) => {
    // Показати "друкує..."
  });

  return channel;
}
```

## Background Jobs (Oban)

```elixir
# lib/mystetstvo/workers/translate_artwork.ex
defmodule Mystetstvo.Workers.TranslateArtwork do
  use Oban.Worker, queue: :default, max_attempts: 3

  @impl Oban.Worker
  def perform(%Oban.Job{args: %{"artwork_id" => id, "languages" => langs}}) do
    artwork = Mystetstvo.Gallery.get_artwork!(id)

    translations =
      Enum.reduce(langs, artwork.translations || %{}, fn lang, acc ->
        case Mystetstvo.AI.translate(artwork.title, lang) do
          {:ok, translated} -> Map.put(acc, lang, %{"title" => translated})
          {:error, _} -> acc
        end
      end)

    artwork
    |> Ecto.Changeset.change(%{translations: translations})
    |> Mystetstvo.Repo.update()
  end
end

# lib/mystetstvo/workers/analytics_aggregator.ex
defmodule Mystetstvo.Workers.AnalyticsAggregator do
  use Oban.Worker, queue: :default

  @impl Oban.Worker
  def perform(_job) do
    Mystetstvo.Analytics.aggregate_hourly()
    :ok
  end
end
```

## Supervision Trees та відмовостійкість

```elixir
# lib/mystetstvo/application.ex
defmodule Mystetstvo.Application do
  use Application

  @impl true
  def start(_type, _args) do
    children = [
      # Database
      Mystetstvo.Repo,

      # PubSub for Phoenix Channels
      {Phoenix.PubSub, name: Mystetstvo.PubSub},

      # Telemetry
      MystetstvoWeb.Telemetry,

      # Background Jobs
      {Oban, Application.fetch_env!(:mystetstvo, Oban)},

      # Clustering (auto-discovery in K8s)
      {Cluster.Supervisor, [
        topologies: Application.get_env(:mystetstvo, :cluster_topologies, []),
        strategy: Cluster.Strategy.Kubernetes.DNS
      ]},

      # Rate limiter backend
      {Hammer.Backend.ETS, [
        expiry_ms: 60_000 * 60,
        cleanup_interval_ms: 60_000 * 10
      ]},

      # Web Endpoint (MUST be last!)
      MystetstvoWeb.Endpoint
    ]

    opts = [strategy: :one_for_one, name: Mystetstvo.Supervisor]
    Supervisor.start_link(children, opts)
  end

  @impl true
  def config_change(changed, _new, removed) do
    MystetstvoWeb.Endpoint.config_change(changed, removed)
    :ok
  end
end
```

### Чому це відмовостійко

1. **`:one_for_one`** — якщо один child process впаде, тільки він перезапускається
2. **Ecto Repo** — connection pool автоматично відновлюється при розриві з'єднання з БД
3. **Oban** — failed jobs автоматично retried з exponential backoff
4. **Phoenix Channels** — WebSocket з'єднання автоматично перепідключаються
5. **Clustering** — нові ноди автоматично знаходять одна одну через DNS

## Rate Limiting (Hammer)

```elixir
# Вже налаштовано в router.ex через Hammer.Plug
# Додаткові ліміти для чутливих ендпоінтів:

# lib/mystetstvo_web/controllers/auth_controller.ex
def login(conn, %{"email" => email, "password" => password}) do
  case Hammer.check_rate("login:#{conn.remote_ip}", 60_000, 5) do
    {:allow, _} ->
      case Accounts.authenticate(email, password) do
        {:ok, user} ->
          {:ok, access, _} = Guardian.encode_and_sign(user, %{}, ttl: {15, :minute})
          {:ok, refresh, _} = Guardian.encode_and_sign(user, %{"typ" => "refresh"}, ttl: {30, :day})
          json(conn, %{access_token: access, refresh_token: refresh})
        {:error, :invalid_credentials} ->
          conn |> put_status(401) |> json(%{error: "invalid credentials"})
      end
    {:deny, _} ->
      conn |> put_status(429) |> json(%{error: "too many attempts, try later"})
  end
end
```

## Телеметрія та моніторинг

```elixir
# lib/mystetstvo_web/telemetry.ex
defmodule MystetstvoWeb.Telemetry do
  use Supervisor
  import Telemetry.Metrics

  def start_link(arg), do: Supervisor.start_link(__MODULE__, arg, name: __MODULE__)

  @impl true
  def init(_arg) do
    children = [
      {:telemetry_poller, measurements: periodic_measurements(), period: 10_000}
    ]
    Supervisor.init(children, strategy: :one_for_one)
  end

  def metrics do
    [
      # Phoenix
      summary("phoenix.endpoint.stop.duration", unit: {:native, :millisecond}),
      counter("phoenix.router_dispatch.stop.count", tags: [:route]),
      summary("phoenix.router_dispatch.stop.duration", unit: {:native, :millisecond}, tags: [:route]),

      # Ecto
      summary("mystetstvo.repo.query.total_time", unit: {:native, :millisecond}),
      summary("mystetstvo.repo.query.queue_time", unit: {:native, :millisecond}),
      counter("mystetstvo.repo.query.count"),

      # BEAM VM
      last_value("vm.memory.total", unit: :byte),
      last_value("vm.total_run_queue_lengths.total"),
      last_value("vm.system_counts.process_count"),

      # Oban
      counter("oban.job.stop.count", tags: [:queue, :worker]),
      summary("oban.job.stop.duration", unit: {:native, :millisecond}),
      counter("oban.job.exception.count", tags: [:queue, :worker])
    ]
  end

  defp periodic_measurements do
    [{__MODULE__, :measure_users_online, []}]
  end

  def measure_users_online do
    count = MystetstvoWeb.Presence.list("users:online") |> map_size()
    :telemetry.execute([:mystetstvo, :users], %{online: count}, %{})
  end
end
```

## Тестування

```elixir
# test/mystetstvo_web/controllers/artwork_controller_test.exs
defmodule MystetstvoWeb.ArtworkControllerTest do
  use MystetstvoWeb.ConnCase, async: true
  import Mystetstvo.Factory

  setup %{conn: conn} do
    user = insert(:user)
    {:ok, token, _} = Mystetstvo.Guardian.encode_and_sign(user)

    conn =
      conn
      |> put_req_header("accept", "application/json")
      |> put_req_header("authorization", "Bearer #{token}")

    %{conn: conn, user: user}
  end

  describe "GET /api/v1/artworks" do
    test "lists active artworks", %{conn: conn} do
      insert_list(3, :artwork, status: :active)
      insert(:artwork, status: :draft)  # should not appear

      conn = get(conn, ~p"/api/v1/artworks")
      assert %{"data" => artworks, "meta" => meta} = json_response(conn, 200)
      assert length(artworks) == 3
      assert meta["total"] == 3
    end

    test "filters by category", %{conn: conn} do
      insert(:artwork, category: "painting", status: :active)
      insert(:artwork, category: "sculpture", status: :active)

      conn = get(conn, ~p"/api/v1/artworks?category=painting")
      assert %{"data" => [artwork]} = json_response(conn, 200)
      assert artwork["category"] == "painting"
    end
  end

  describe "POST /api/v1/artworks" do
    test "creates artwork", %{conn: conn} do
      params = %{
        artwork: %{
          title: "Нічний Київ",
          price: 50000,
          category: "painting",
          images: ["https://example.com/img.jpg"]
        }
      }

      conn = post(conn, ~p"/api/v1/artworks", params)
      assert %{"data" => artwork} = json_response(conn, 201)
      assert artwork["title"] == "Нічний Київ"
    end

    test "returns errors for invalid data", %{conn: conn} do
      conn = post(conn, ~p"/api/v1/artworks", %{artwork: %{}})
      assert %{"errors" => errors} = json_response(conn, 422)
      assert errors["title"]
    end
  end
end
```

## Docker та Release

```dockerfile
# Dockerfile
ARG ELIXIR_VERSION=1.16.1
ARG OTP_VERSION=26.2.2
ARG DEBIAN_VERSION=bookworm-20240130-slim

# Build
FROM hexpm/elixir:${ELIXIR_VERSION}-erlang-${OTP_VERSION}-debian-${DEBIAN_VERSION} AS build
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*
WORKDIR /app

ENV MIX_ENV=prod

COPY mix.exs mix.lock ./
RUN mix deps.get --only prod
RUN mix deps.compile

COPY config config
COPY lib lib
COPY priv priv

RUN mix compile
RUN mix release

# Runtime
FROM debian:${DEBIAN_VERSION}
RUN apt-get update && apt-get install -y libstdc++6 openssl libncurses5 locales ca-certificates \
    && rm -rf /var/lib/apt/lists/*
RUN sed -i '/en_US.UTF-8/s/^# //g' /etc/locale.gen && locale-gen
ENV LANG=en_US.UTF-8

WORKDIR /app
RUN useradd --create-home appuser && chown -R appuser:appuser /app
USER appuser

COPY --from=build --chown=appuser /app/_build/prod/rel/mystetstvo ./

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:4000/health || exit 1

CMD ["bin/mystetstvo", "start"]
```

### Docker Compose

```yaml
version: "3.9"
services:
  app:
    build: .
    ports:
      - "4000:4000"
    environment:
      DATABASE_URL: ecto://mystetstvo:${DB_PASSWORD}@db:5432/mystetstvo
      SECRET_KEY_BASE: ${SECRET_KEY_BASE}
      JWT_SECRET: ${JWT_SECRET}
      PHX_HOST: mystetstvo.com
      CORS_ORIGINS: http://localhost:5173,https://mystetstvo.com
      S3_ACCESS_KEY: ${S3_ACCESS_KEY}
      S3_SECRET_KEY: ${S3_SECRET_KEY}
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped
    deploy:
      replicas: 3

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

volumes:
  pgdata:
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
  selector:
    matchLabels:
      app: mystetstvo-api
  template:
    metadata:
      labels:
        app: mystetstvo-api
    spec:
      containers:
        - name: app
          image: ghcr.io/your-org/mystetstvo-elixir:latest
          ports:
            - containerPort: 4000
          envFrom:
            - secretRef:
                name: mystetstvo-secrets
          env:
            - name: RELEASE_DISTRIBUTION
              value: "name"
            - name: RELEASE_NODE
              valueFrom:
                fieldRef:
                  fieldPath: metadata.name
          resources:
            requests:
              cpu: 100m
              memory: 256Mi
            limits:
              cpu: "1"
              memory: 1Gi
          livenessProbe:
            httpGet:
              path: /health
              port: 4000
            initialDelaySeconds: 15
            periodSeconds: 15
          readinessProbe:
            httpGet:
              path: /ready
              port: 4000
            initialDelaySeconds: 10
            periodSeconds: 10
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
  maxReplicas: 30
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
```

## Підключення до Frontend

### Env змінні

```env
# .env.local
VITE_API_URL=http://localhost:4000

# .env.production
VITE_API_URL=https://api.mystetstvo.com
```

### Особливості Elixir для фронту

1. **WebSocket** — Phoenix Channels для месенджера (потрібен `phoenix` npm пакет)
2. **Real-time Presence** — хто онлайн, хто друкує
3. **Швидкі відповіді** — BEAM конкурентність забезпечує low latency навіть під навантаженням

```bash
npm install phoenix  # для Phoenix Channels
```

## Порівняння Go vs Elixir

| Аспект | Go | Elixir |
|---|---|---|
| **Конкурентність** | goroutines (manual) | BEAM processes (supervised) |
| **Відмовостійкість** | panic → process dies | supervisor restart |
| **WebSocket** | manual implementation | Phoenix Channels (built-in) |
| **Background jobs** | custom or third-party | Oban (battle-tested) |
| **Hot reload** | restart needed | hot code reload |
| **Memory** | Lower baseline | Higher baseline, better GC |
| **Throughput** | Higher raw throughput | Higher concurrent connections |
| **Learning curve** | Simple language | Functional paradigm |

**Рекомендація**: Для Мистецтво **Elixir** — кращий вибір завдяки вбудованим WebSocket для месенджера, supervision trees для надійності, та Oban для фонових задач (переклади, аналітика).
