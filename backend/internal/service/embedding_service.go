package service

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/art-haven-hub/backend/internal/model"
)

type EmbeddingService struct {
	openaiKey  string
	httpClient *http.Client
}

func NewEmbeddingService(openaiKey string) *EmbeddingService {
	return &EmbeddingService{
		openaiKey:  openaiKey,
		httpClient: &http.Client{Timeout: 30 * time.Second},
	}
}

func (s *EmbeddingService) IsConfigured() bool {
	return s.openaiKey != ""
}

type embeddingRequest struct {
	Model string `json:"model"`
	Input string `json:"input"`
}

type embeddingResponse struct {
	Data []struct {
		Embedding []float32 `json:"embedding"`
	} `json:"data"`
}

func (s *EmbeddingService) Generate(ctx context.Context, text string) ([]float32, error) {
	if s.openaiKey == "" {
		return nil, fmt.Errorf("OpenAI API key not configured")
	}

	body, _ := json.Marshal(embeddingRequest{
		Model: "text-embedding-3-small",
		Input: text,
	})

	req, err := http.NewRequestWithContext(ctx, "POST", "https://api.openai.com/v1/embeddings", bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+s.openaiKey)

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("calling OpenAI: %w", err)
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("OpenAI error %d: %s", resp.StatusCode, string(respBody))
	}

	var result embeddingResponse
	if err := json.Unmarshal(respBody, &result); err != nil {
		return nil, fmt.Errorf("decoding response: %w", err)
	}

	if len(result.Data) == 0 {
		return nil, fmt.Errorf("no embedding returned")
	}

	return result.Data[0].Embedding, nil
}

func (s *EmbeddingService) ArtworkText(a *model.Artwork) string {
	parts := []string{a.Title}
	if a.Description != nil {
		parts = append(parts, *a.Description)
	}
	if len(a.Tags) > 0 {
		parts = append(parts, "Tags: "+strings.Join(a.Tags, ", "))
	}
	return strings.Join(parts, ". ")
}

func (s *EmbeddingService) FormatVector(embedding []float32) string {
	strs := make([]string, len(embedding))
	for i, v := range embedding {
		strs[i] = fmt.Sprintf("%f", v)
	}
	return "[" + strings.Join(strs, ",") + "]"
}
