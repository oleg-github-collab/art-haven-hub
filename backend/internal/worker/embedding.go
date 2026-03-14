package worker

import (
	"context"
	"fmt"
	"log/slog"
	"strings"
	"time"

	"github.com/art-haven-hub/backend/internal/repository"
	"github.com/art-haven-hub/backend/internal/service"
	"github.com/jmoiron/sqlx"
	"github.com/redis/go-redis/v9"
)

type EmbeddingWorker struct {
	db           *sqlx.DB
	rdb          *redis.Client
	searchRepo   *repository.SearchRepo
	embeddingSvc *service.EmbeddingService
}

func NewEmbeddingWorker(db *sqlx.DB, rdb *redis.Client, searchRepo *repository.SearchRepo, embeddingSvc *service.EmbeddingService) *EmbeddingWorker {
	return &EmbeddingWorker{
		db:           db,
		rdb:          rdb,
		searchRepo:   searchRepo,
		embeddingSvc: embeddingSvc,
	}
}

func (w *EmbeddingWorker) Start(ctx context.Context) {
	if !w.embeddingSvc.IsConfigured() {
		slog.Info("embedding worker disabled: OpenAI key not configured")
		return
	}

	go w.processQueue(ctx)
	slog.Info("embedding worker started")
}

func (w *EmbeddingWorker) processQueue(ctx context.Context) {
	for {
		select {
		case <-ctx.Done():
			return
		default:
		}

		// BLPOP with 5 second timeout
		result, err := w.rdb.BLPop(ctx, 5*time.Second, "embedding:queue").Result()
		if err != nil {
			continue
		}

		if len(result) < 2 {
			continue
		}

		// Format: "type:id" e.g. "artwork:uuid-here"
		parts := strings.SplitN(result[1], ":", 2)
		if len(parts) != 2 {
			continue
		}

		entityType := parts[0]
		entityID := parts[1]

		switch entityType {
		case "artwork":
			w.processArtwork(ctx, entityID)
		case "post":
			w.processPost(ctx, entityID)
		case "announcement":
			w.processAnnouncement(ctx, entityID)
		case "taste":
			w.processTaste(ctx, entityID)
		default:
			slog.Warn("unknown embedding entity type", "type", entityType)
		}
	}
}

func (w *EmbeddingWorker) processArtwork(ctx context.Context, id string) {
	var title string
	var description *string
	var tags []string

	row := w.db.QueryRowContext(ctx, `SELECT title, description, tags FROM artworks WHERE id = $1`, id)
	if err := row.Scan(&title, &description, (*model_StringArray)(&tags)); err != nil {
		slog.Error("fetching artwork for embedding", "id", id, "error", err)
		return
	}

	text := title
	if description != nil {
		text += ". " + *description
	}
	if len(tags) > 0 {
		text += ". Tags: " + strings.Join(tags, ", ")
	}

	embedding, err := w.embeddingSvc.Generate(ctx, text)
	if err != nil {
		slog.Error("generating artwork embedding", "id", id, "error", err)
		return
	}

	vecStr := w.embeddingSvc.FormatVector(embedding)
	if err := w.searchRepo.UpdateArtworkEmbedding(ctx, mustParseUUID(id), vecStr); err != nil {
		slog.Error("storing artwork embedding", "id", id, "error", err)
		return
	}

	slog.Debug("artwork embedding generated", "id", id)
}

func (w *EmbeddingWorker) processPost(ctx context.Context, id string) {
	var content string
	row := w.db.QueryRowContext(ctx, `SELECT content FROM feed_posts WHERE id = $1`, id)
	if err := row.Scan(&content); err != nil {
		return
	}

	embedding, err := w.embeddingSvc.Generate(ctx, content)
	if err != nil {
		return
	}

	vecStr := w.embeddingSvc.FormatVector(embedding)
	_ = w.searchRepo.UpdatePostEmbedding(ctx, mustParseUUID(id), vecStr)
}

func (w *EmbeddingWorker) processAnnouncement(ctx context.Context, id string) {
	var title, description string
	row := w.db.QueryRowContext(ctx, `SELECT title, description FROM announcements WHERE id = $1`, id)
	if err := row.Scan(&title, &description); err != nil {
		return
	}

	embedding, err := w.embeddingSvc.Generate(ctx, title+". "+description)
	if err != nil {
		return
	}

	vecStr := w.embeddingSvc.FormatVector(embedding)
	_ = w.searchRepo.UpdateAnnouncementEmbedding(ctx, mustParseUUID(id), vecStr)
}

func (w *EmbeddingWorker) processTaste(ctx context.Context, userID string) {
	embeddings, err := w.searchRepo.GetLikedArtworkEmbeddings(ctx, mustParseUUID(userID))
	if err != nil || len(embeddings) == 0 {
		return
	}

	// Average all embeddings
	dim := len(embeddings[0])
	avg := make([]float32, dim)
	for _, emb := range embeddings {
		for i, v := range emb {
			avg[i] += v
		}
	}
	n := float32(len(embeddings))
	for i := range avg {
		avg[i] /= n
	}

	vecStr := w.embeddingSvc.FormatVector(avg)
	_ = w.searchRepo.UpdateTasteEmbedding(ctx, mustParseUUID(userID), vecStr)
}

// EnqueueArtwork adds an artwork to the embedding queue
func EnqueueEmbedding(ctx context.Context, rdb *redis.Client, entityType, id string) error {
	return rdb.RPush(ctx, "embedding:queue", fmt.Sprintf("%s:%s", entityType, id)).Err()
}

// model_StringArray is a minimal scanner for TEXT[] columns
type model_StringArray []string

func (a *model_StringArray) Scan(src interface{}) error {
	if src == nil {
		*a = nil
		return nil
	}
	switch v := src.(type) {
	case []byte:
		*a = parsePostgresArray(string(v))
	case string:
		*a = parsePostgresArray(v)
	}
	return nil
}

func parsePostgresArray(s string) []string {
	s = strings.Trim(s, "{}")
	if s == "" {
		return nil
	}
	return strings.Split(s, ",")
}

func mustParseUUID(s string) [16]byte {
	var id [16]byte
	// Simple hex parse for UUID without dashes
	clean := strings.ReplaceAll(s, "-", "")
	if len(clean) != 32 {
		return id
	}
	for i := 0; i < 16; i++ {
		fmt.Sscanf(clean[i*2:i*2+2], "%02x", &id[i])
	}
	return id
}
