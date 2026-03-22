package server

import (
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"

	"github.com/art-haven-hub/backend/internal/config"
	"github.com/art-haven-hub/backend/internal/handler"
	"github.com/art-haven-hub/backend/internal/middleware"
	"github.com/art-haven-hub/backend/internal/pkg/jwt"
	"github.com/art-haven-hub/backend/internal/repository"
	"github.com/art-haven-hub/backend/internal/service"
	"github.com/art-haven-hub/backend/internal/ws"
	"github.com/jmoiron/sqlx"
	"github.com/redis/go-redis/v9"
	stripe "github.com/stripe/stripe-go/v81"
)

func NewRouter(cfg *config.Config, db *sqlx.DB, rdb *redis.Client) http.Handler {
	r := chi.NewRouter()

	// Global middleware
	r.Use(chimw.RealIP)
	r.Use(middleware.RequestID)
	r.Use(middleware.Logger)
	r.Use(middleware.Recovery)
	r.Use(middleware.CORS(cfg.CORSOrigins))
	r.Use(middleware.RateLimit(cfg.RateLimitRPS, cfg.RateLimitBurst))
	r.Use(chimw.Compress(5))

	// Dependencies
	jwtManager := jwt.NewManager(cfg.JWTSecret, cfg.JWTAccessDuration, cfg.JWTRefreshDuration)

	// Stripe
	stripe.Key = cfg.StripeSecretKey

	// Repositories
	userRepo := repository.NewUserRepo(db)
	artworkRepo := repository.NewArtworkRepo(db)
	cartRepo := repository.NewCartRepo(db)
	orderRepo := repository.NewOrderRepo(db)
	feedRepo := repository.NewFeedRepo(db)
	messengerRepo := repository.NewMessengerRepo(db)
	boardRepo := repository.NewBoardRepo(db)
	eventRepo := repository.NewEventRepo(db)
	blogRepo := repository.NewBlogRepo(db)
	dashboardRepo := repository.NewDashboardRepo(db)
	uploadRepo := repository.NewUploadRepo(db)
	promotionRepo := repository.NewPromotionRepo(db)
	subscriptionRepo := repository.NewSubscriptionRepo(db)
	searchRepo := repository.NewSearchRepo(db)
	callRepo := repository.NewCallRepo(db)
	socialHubRepo := repository.NewSocialHubRepo(db)

	// WebSocket Hub
	wsHub := ws.NewHub(rdb)

	// Services
	authService := service.NewAuthService(userRepo, jwtManager, cfg.GoogleClientID)
	userService := service.NewUserService(userRepo, cfg.UploadDir, cfg.UploadBaseURL, cfg.UploadMaxSize)
	artworkService := service.NewArtworkService(artworkRepo)
	cartService := service.NewCartService(cartRepo, artworkRepo)
	orderService := service.NewOrderService(orderRepo, cartRepo, artworkRepo, cfg.StripeSuccessURL, cfg.StripeCancelURL)
	feedService := service.NewFeedService(feedRepo)
	messengerService := service.NewMessengerService(messengerRepo, wsHub)
	callService := service.NewCallService(callRepo, messengerRepo, wsHub, cfg.CallTimeout, cfg.STUNServers, cfg.TURNServers, cfg.TURNUsername, cfg.TURNPassword)
	translationService := service.NewTranslationService(artworkRepo, cfg.OpenAIKey)
	embeddingService := service.NewEmbeddingService(cfg.OpenAIKey)
	socialHubService := service.NewSocialHubService(socialHubRepo)

	// Handlers
	healthH := handler.NewHealthHandler(db, rdb)
	authH := handler.NewAuthHandler(authService)
	userH := handler.NewUserHandler(userService)
	artworkH := handler.NewArtworkHandler(artworkService)
	cartH := handler.NewCartHandler(cartService, orderService)
	orderH := handler.NewOrderHandler(orderService)
	webhookH := handler.NewWebhookHandler(orderService, cfg.StripeWebhookSecret)
	feedH := handler.NewFeedHandler(feedService)
	messengerH := handler.NewMessengerHandler(messengerService, callService, wsHub, jwtManager)
	boardH := handler.NewBoardHandler(boardRepo)
	eventH := handler.NewEventHandler(eventRepo)
	blogH := handler.NewBlogHandler(blogRepo)
	dashboardH := handler.NewDashboardHandler(dashboardRepo)
	uploadH := handler.NewUploadHandler(uploadRepo, cfg.UploadDir, cfg.UploadBaseURL, cfg.UploadMaxSize)
	translationH := handler.NewTranslationHandler(translationService)
	promotionH := handler.NewPromotionHandler(promotionRepo, cfg.StripeSuccessURL, cfg.StripeCancelURL)
	subscriptionH := handler.NewSubscriptionHandler(subscriptionRepo, userRepo, cfg.StripeProPriceID, cfg.StripeGalleryPriceID, cfg.StripeSuccessURL, cfg.StripeCancelURL)
	searchH := handler.NewSearchHandler(searchRepo, embeddingService)
	socialHubH := handler.NewSocialHubHandler(socialHubService)

	// Health checks
	r.Get("/health", healthH.Health)
	r.Get("/ready", healthH.Ready)

	// API v1
	r.Route("/api/v1", func(r chi.Router) {
		// --- Auth (public) ---
		r.Post("/auth/register", authH.Register)
		r.Post("/auth/login", authH.Login)
		r.Post("/auth/refresh", authH.Refresh)
		r.Post("/auth/logout", authH.Logout)
		r.Post("/auth/google", authH.GoogleLogin)

		// --- Public with optional auth ---
		r.Group(func(r chi.Router) {
			r.Use(middleware.OptionalAuth(jwtManager))
			r.Get("/users/{handle}", userH.GetProfile)
			r.Get("/artworks", artworkH.List)
			r.Get("/artworks/{id}", artworkH.GetByID)
			r.Get("/artworks/{id}/reviews", artworkH.GetReviews)
			r.Get("/feed", feedH.ListPosts)
			r.Get("/feed/{id}", feedH.GetPost)
			r.Get("/feed/{id}/comments", feedH.GetComments)
			r.Get("/events/{id}", eventH.GetByID)
		})

		// --- Public ---
		r.Get("/artists", userH.ListArtists)
		r.Get("/categories", artworkH.GetCategories)
		r.Get("/board", boardH.List)
		r.Get("/events", eventH.List)
		r.Get("/blog", blogH.List)
		r.Get("/blog/{slug}", blogH.GetBySlug)
		r.Get("/promotions/pricing", promotionH.GetPricing)
		r.Get("/subscriptions/plans", subscriptionH.GetPlans)
		r.Get("/search", searchH.Search)
		r.Get("/artworks/{id}/similar", searchH.SimilarArtworks)
		r.Get("/social/workflows/public", socialHubH.ListPublicWorkflows)

		// --- Protected routes ---
		r.Group(func(r chi.Router) {
			r.Use(middleware.Auth(jwtManager))

			// Auth
			r.Get("/auth/me", authH.Me)

			// Profile
			r.Put("/users/me", userH.UpdateProfile)
			r.Put("/users/me/avatar", userH.UploadAvatar)

			// Follows
			r.Post("/users/{id}/follow", userH.Follow)
			r.Delete("/users/{id}/follow", userH.Unfollow)

			// Artworks
			r.Post("/artworks", artworkH.Create)
			r.Put("/artworks/{id}", artworkH.Update)
			r.Delete("/artworks/{id}", artworkH.Delete)
			r.Post("/artworks/{id}/reviews", artworkH.CreateReview)
			r.Post("/artworks/{id}/favorite", artworkH.AddFavorite)
			r.Delete("/artworks/{id}/favorite", artworkH.RemoveFavorite)
			r.Get("/artworks/favorites", artworkH.GetFavorites)

			// Cart
			r.Get("/cart", cartH.GetCart)
			r.Post("/cart/items", cartH.AddItem)
			r.Put("/cart/items", cartH.UpdateItem)
			r.Delete("/cart/items", cartH.RemoveItem)
			r.Delete("/cart", cartH.ClearCart)
			r.Post("/cart/sync", cartH.SyncCart)

			// Checkout & Orders
			r.Post("/checkout/session", cartH.Checkout)
			r.Get("/orders", orderH.GetOrders)
			r.Get("/orders/{id}", orderH.GetOrder)
			r.Get("/orders/seller", orderH.GetSellerOrders)

			// Feed
			r.Post("/feed", feedH.CreatePost)
			r.Put("/feed/{id}", feedH.UpdatePost)
			r.Delete("/feed/{id}", feedH.DeletePost)
			r.Post("/feed/{id}/like", feedH.LikePost)
			r.Delete("/feed/{id}/like", feedH.UnlikePost)
			r.Post("/feed/{id}/repost", feedH.RepostPost)
			r.Delete("/feed/{id}/repost", feedH.UnrepostPost)
			r.Post("/feed/{id}/bookmark", feedH.BookmarkPost)
			r.Delete("/feed/{id}/bookmark", feedH.UnbookmarkPost)
			r.Get("/feed/bookmarks", feedH.GetBookmarks)
			r.Post("/feed/{id}/comments", feedH.CreateComment)
			r.Delete("/feed/comments/{commentId}", feedH.DeleteComment)
			r.Post("/feed/comments/{commentId}/like", feedH.LikeComment)

			// Board
			r.Post("/board", boardH.Create)
			r.Put("/board/{id}", boardH.Update)
			r.Delete("/board/{id}", boardH.Delete)

			// Events
			r.Post("/events", eventH.Create)
			r.Delete("/events/{id}", eventH.Delete)
			r.Post("/events/{id}/attend", eventH.Attend)
			r.Delete("/events/{id}/attend", eventH.Unattend)

			// Dashboard
			r.Get("/dashboard/stats", dashboardH.GetStats)
			r.Get("/dashboard/artworks", dashboardH.GetArtworks)
			r.Get("/dashboard/analytics", dashboardH.GetAnalytics)
			r.Get("/dashboard/orders", dashboardH.GetOrders)

			// Blog (admin)
			r.Post("/blog", blogH.Create)
			r.Put("/blog/{id}", blogH.Update)
			r.Delete("/blog/{id}", blogH.Delete)

			// Uploads
			r.Post("/uploads", uploadH.Upload)
			r.Delete("/uploads/{id}", uploadH.Delete)

			// Translations
			r.Post("/translations", translationH.Translate)
			r.Get("/translations/{jobId}", translationH.GetJob)

			// Promotions
			r.Post("/promotions", promotionH.Create)

			// Search (authenticated)
			r.Get("/recommendations", searchH.Recommendations)
			r.Get("/board/{id}/matches", searchH.BoardMatches)

			// Subscriptions
			r.Get("/subscriptions/me", subscriptionH.GetMySubscription)
			r.Post("/subscriptions/subscribe", subscriptionH.Subscribe)
			r.Post("/subscriptions/cancel", subscriptionH.Cancel)
			r.Post("/subscriptions/portal", subscriptionH.Portal)

			// Messenger
			r.Get("/conversations", messengerH.GetConversations)
			r.Post("/conversations", messengerH.CreateConversation)
			r.Get("/conversations/{id}", messengerH.GetConversation)
			r.Get("/conversations/{id}/messages", messengerH.GetMessages)
			r.Post("/conversations/{id}/messages", messengerH.SendMessage)
			r.Put("/conversations/{id}/read", messengerH.MarkRead)
			r.Put("/conversations/{id}/pin", messengerH.PinConversation)
			r.Put("/conversations/{id}/mute", messengerH.MuteConversation)

			// Calls
			r.Get("/calls/history", messengerH.GetCallHistory)
			r.Get("/calls/ice-servers", messengerH.GetICEServers)
			r.Get("/conversations/{id}/calls", messengerH.GetConversationCallHistory)

			// Social Hub — Accounts
			r.Get("/social/accounts", socialHubH.GetAccounts)
			r.Post("/social/accounts", socialHubH.ConnectAccount)
			r.Delete("/social/accounts/{platform}", socialHubH.DisconnectAccount)
			r.Put("/social/accounts/auto-post", socialHubH.UpdateAutoPost)

			// Social Hub — Scheduled Posts / Calendar / Queue
			r.Get("/social/posts", socialHubH.ListPosts)
			r.Post("/social/posts", socialHubH.CreatePost)
			r.Get("/social/posts/{id}", socialHubH.GetPost)
			r.Put("/social/posts/{id}", socialHubH.UpdatePost)
			r.Delete("/social/posts/{id}", socialHubH.DeletePost)
			r.Post("/social/posts/{id}/duplicate", socialHubH.DuplicatePost)
			r.Post("/social/posts/{id}/retry", socialHubH.RetryPost)
			r.Get("/social/queue", socialHubH.GetQueue)
			r.Delete("/social/queue/completed", socialHubH.ClearCompleted)

			// Social Hub — Campaigns
			r.Get("/social/campaigns", socialHubH.ListCampaigns)
			r.Post("/social/campaigns", socialHubH.CreateCampaign)
			r.Get("/social/campaigns/{id}", socialHubH.GetCampaign)
			r.Put("/social/campaigns/{id}", socialHubH.UpdateCampaign)
			r.Delete("/social/campaigns/{id}", socialHubH.DeleteCampaign)

			// Social Hub — Workflows
			r.Get("/social/workflows", socialHubH.ListWorkflows)
			r.Post("/social/workflows", socialHubH.CreateWorkflow)
			r.Get("/social/workflows/{id}", socialHubH.GetWorkflow)
			r.Put("/social/workflows/{id}", socialHubH.UpdateWorkflow)
			r.Delete("/social/workflows/{id}", socialHubH.DeleteWorkflow)

			// Social Hub — Stats
			r.Get("/social/stats", socialHubH.GetStats)
		})

		// --- Public follows ---
		r.Get("/users/{id}/followers", userH.GetFollowers)
		r.Get("/users/{id}/following", userH.GetFollowing)

		// --- Stripe Webhook ---
		r.Post("/webhooks/stripe", webhookH.StripeWebhook)

		// Placeholder: return API info
		r.Get("/", func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(`{"api":"Art Haven Hub","version":"1.0.0","status":"ok"}`))
		})
	})

	// WebSocket endpoint
	r.Get("/ws", messengerH.WebSocket)

	// File serving (uploads)
	if cfg.UploadDir != "" {
		fileServer := http.FileServer(http.Dir(cfg.UploadDir))
		r.Handle("/files/*", http.StripPrefix("/files/", fileServer))
	}

	// SPA serving — serve built frontend from StaticDir
	if cfg.StaticDir != "" {
		spaHandler := spaFileServer(cfg.StaticDir)
		r.NotFound(spaHandler.ServeHTTP)
	}

	return r
}

// spaFileServer serves static files and falls back to index.html for SPA routes.
func spaFileServer(staticDir string) http.Handler {
	fsys := http.Dir(staticDir)
	fileServer := http.FileServer(fsys)

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		path := r.URL.Path

		// Skip API/ws/file routes (shouldn't reach here, but safety net)
		if strings.HasPrefix(path, "/api/") || strings.HasPrefix(path, "/ws") || strings.HasPrefix(path, "/files/") || path == "/health" || path == "/ready" {
			http.NotFound(w, r)
			return
		}

		// Try to serve the static file
		fullPath := filepath.Join(staticDir, filepath.Clean(path))
		if info, err := os.Stat(fullPath); err == nil && !info.IsDir() {
			fileServer.ServeHTTP(w, r)
			return
		}

		// Check if it's a static asset that doesn't exist (return 404, not index.html)
		if hasStaticExtension(path) {
			http.NotFound(w, r)
			return
		}

		// Fallback to index.html for SPA client-side routing
		indexPath := filepath.Join(staticDir, "index.html")
		if _, err := os.Stat(indexPath); err != nil {
			http.NotFound(w, r)
			return
		}
		http.ServeFile(w, r, indexPath)
	})
}

func hasStaticExtension(path string) bool {
	staticExts := []string{".js", ".css", ".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico", ".woff", ".woff2", ".ttf", ".eot", ".map", ".webp", ".avif"}
	for _, ext := range staticExts {
		if strings.HasSuffix(path, ext) {
			return true
		}
	}
	return false
}

