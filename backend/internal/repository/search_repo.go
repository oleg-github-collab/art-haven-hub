package repository

import (
	"context"
	"fmt"
	"strings"

	"github.com/art-haven-hub/backend/internal/model"
	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
)

type SearchRepo struct {
	db *sqlx.DB
}

func NewSearchRepo(db *sqlx.DB) *SearchRepo {
	return &SearchRepo{db: db}
}

type SearchResult struct {
	ID         uuid.UUID `json:"id" db:"id"`
	Type       string    `json:"type"` // artwork, artist, post
	Title      string    `json:"title" db:"title"`
	Image      *string   `json:"image,omitempty" db:"image"`
	Similarity float64   `json:"similarity" db:"similarity"`
}

// HybridSearch combines vector similarity with text search
func (r *SearchRepo) HybridSearch(ctx context.Context, query string, embedding string, limit int) ([]SearchResult, error) {
	var results []SearchResult

	if embedding != "" {
		err := r.db.SelectContext(ctx, &results, `
			SELECT id, title, cover_image AS image,
				CASE
					WHEN embedding IS NOT NULL THEN
						(0.7 * (1 - (embedding <=> $1::vector))) +
						(0.3 * COALESCE(similarity(title, $2), 0))
					ELSE COALESCE(similarity(title, $2), 0)
				END AS similarity
			FROM artworks
			WHERE status IN ('active', 'promoted')
			  AND (embedding IS NOT NULL OR title % $2)
			ORDER BY similarity DESC
			LIMIT $3
		`, embedding, query, limit)
		if err != nil {
			return nil, fmt.Errorf("hybrid search: %w", err)
		}
	} else {
		// Text-only fallback
		err := r.db.SelectContext(ctx, &results, `
			SELECT id, title, cover_image AS image,
				COALESCE(similarity(title, $1), 0) AS similarity
			FROM artworks
			WHERE status IN ('active', 'promoted')
			  AND (title % $1 OR title ILIKE '%' || $1 || '%')
			ORDER BY similarity DESC
			LIMIT $2
		`, query, limit)
		if err != nil {
			return nil, fmt.Errorf("text search: %w", err)
		}
	}

	for i := range results {
		results[i].Type = "artwork"
	}

	return results, nil
}

// SimilarArtworks finds artworks similar to a given one by vector distance
func (r *SearchRepo) SimilarArtworks(ctx context.Context, artworkID uuid.UUID, limit int) ([]model.Artwork, error) {
	var artworks []model.Artwork
	err := r.db.SelectContext(ctx, &artworks, `
		SELECT a.*
		FROM artworks a, artworks ref
		WHERE ref.id = $1
		  AND a.id != $1
		  AND a.status IN ('active', 'promoted')
		  AND ref.embedding IS NOT NULL
		  AND a.embedding IS NOT NULL
		ORDER BY a.embedding <=> ref.embedding
		LIMIT $2
	`, artworkID, limit)
	if err != nil {
		return nil, fmt.Errorf("similar artworks: %w", err)
	}
	return artworks, nil
}

// Recommendations based on user taste embedding
func (r *SearchRepo) Recommendations(ctx context.Context, userID uuid.UUID, limit int) ([]model.Artwork, error) {
	var artworks []model.Artwork
	err := r.db.SelectContext(ctx, &artworks, `
		SELECT a.*
		FROM artworks a, users u
		WHERE u.id = $1
		  AND a.status IN ('active', 'promoted')
		  AND u.taste_embedding IS NOT NULL
		  AND a.embedding IS NOT NULL
		ORDER BY a.embedding <=> u.taste_embedding
		LIMIT $2
	`, userID, limit)
	if err != nil {
		return nil, fmt.Errorf("recommendations: %w", err)
	}
	return artworks, nil
}

// BoardMatches finds matching announcements (offer↔seek)
func (r *SearchRepo) BoardMatches(ctx context.Context, announcementID uuid.UUID, limit int) ([]model.Announcement, error) {
	var matches []model.Announcement
	err := r.db.SelectContext(ctx, &matches, `
		SELECT a.*
		FROM announcements a, announcements ref
		WHERE ref.id = $1
		  AND a.id != $1
		  AND a.is_active = true
		  AND a.type != ref.type
		  AND ref.embedding IS NOT NULL
		  AND a.embedding IS NOT NULL
		ORDER BY a.embedding <=> ref.embedding
		LIMIT $2
	`, announcementID, limit)
	if err != nil {
		return nil, fmt.Errorf("board matches: %w", err)
	}
	return matches, nil
}

// UpdateArtworkEmbedding stores the vector for an artwork
func (r *SearchRepo) UpdateArtworkEmbedding(ctx context.Context, artworkID uuid.UUID, embedding string) error {
	_, err := r.db.ExecContext(ctx, `
		UPDATE artworks SET embedding = $1::vector WHERE id = $2
	`, embedding, artworkID)
	return err
}

// UpdatePostEmbedding stores the vector for a feed post
func (r *SearchRepo) UpdatePostEmbedding(ctx context.Context, postID uuid.UUID, embedding string) error {
	_, err := r.db.ExecContext(ctx, `
		UPDATE feed_posts SET embedding = $1::vector WHERE id = $2
	`, embedding, postID)
	return err
}

// UpdateAnnouncementEmbedding stores the vector for an announcement
func (r *SearchRepo) UpdateAnnouncementEmbedding(ctx context.Context, announcementID uuid.UUID, embedding string) error {
	_, err := r.db.ExecContext(ctx, `
		UPDATE announcements SET embedding = $1::vector WHERE id = $2
	`, embedding, announcementID)
	return err
}

// UpdateTasteEmbedding stores the aggregated taste vector for a user
func (r *SearchRepo) UpdateTasteEmbedding(ctx context.Context, userID uuid.UUID, embedding string) error {
	_, err := r.db.ExecContext(ctx, `
		UPDATE users SET taste_embedding = $1::vector WHERE id = $2
	`, embedding, userID)
	return err
}

// GetLikedArtworkEmbeddings fetches embeddings of artworks a user has liked/favorited
func (r *SearchRepo) GetLikedArtworkEmbeddings(ctx context.Context, userID uuid.UUID) ([][]float32, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT a.embedding::text
		FROM artworks a
		JOIN artwork_favorites af ON af.artwork_id = a.id
		WHERE af.user_id = $1 AND a.embedding IS NOT NULL
		LIMIT 100
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var embeddings [][]float32
	for rows.Next() {
		var vecStr string
		if err := rows.Scan(&vecStr); err != nil {
			continue
		}
		vec := parseVectorString(vecStr)
		if vec != nil {
			embeddings = append(embeddings, vec)
		}
	}
	return embeddings, nil
}

func parseVectorString(s string) []float32 {
	s = strings.Trim(s, "[]")
	if s == "" {
		return nil
	}
	parts := strings.Split(s, ",")
	vec := make([]float32, len(parts))
	for i, p := range parts {
		var v float32
		fmt.Sscanf(strings.TrimSpace(p), "%f", &v)
		vec[i] = v
	}
	return vec
}
