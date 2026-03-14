package service

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"sync"
	"time"

	"github.com/art-haven-hub/backend/internal/model"
	"github.com/art-haven-hub/backend/internal/repository"
	"github.com/google/uuid"
)

type TranslationService struct {
	artworkRepo *repository.ArtworkRepo
	openaiKey   string
	httpClient  *http.Client
	jobs        map[uuid.UUID]*model.TranslationJob
	mu          sync.RWMutex
}

func NewTranslationService(artworkRepo *repository.ArtworkRepo, openaiKey string) *TranslationService {
	return &TranslationService{
		artworkRepo: artworkRepo,
		openaiKey:   openaiKey,
		httpClient:  &http.Client{Timeout: 30 * time.Second},
		jobs:        make(map[uuid.UUID]*model.TranslationJob),
	}
}

var langNames = map[string]string{
	"en": "English",
	"uk": "Ukrainian",
	"de": "German",
	"es": "Spanish",
	"fr": "French",
}

func (s *TranslationService) Translate(ctx context.Context, artworkID uuid.UUID, targetLang string) (*model.TranslationJob, error) {
	artwork, err := s.artworkRepo.GetByID(ctx, artworkID)
	if err != nil || artwork == nil {
		return nil, fmt.Errorf("artwork not found")
	}

	job := &model.TranslationJob{
		ID:             uuid.New(),
		ArtworkID:      artworkID,
		TargetLanguage: targetLang,
		Status:         "processing",
		CreatedAt:      time.Now(),
	}

	s.mu.Lock()
	s.jobs[job.ID] = job
	s.mu.Unlock()

	text := artwork.Title
	if artwork.Description != nil {
		text += ". " + *artwork.Description
	}
	go s.processTranslation(job, text)

	return job, nil
}

func (s *TranslationService) GetJob(id uuid.UUID) *model.TranslationJob {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.jobs[id]
}

func (s *TranslationService) processTranslation(job *model.TranslationJob, text string) {
	langName := langNames[job.TargetLanguage]
	if langName == "" {
		langName = job.TargetLanguage
	}

	translated, err := s.callOpenAI(context.Background(), text, langName)

	s.mu.Lock()
	defer s.mu.Unlock()

	if err != nil {
		job.Status = "failed"
		job.Result = err.Error()
		return
	}

	job.Status = "completed"
	job.Result = translated
}

type openAIChatRequest struct {
	Model    string          `json:"model"`
	Messages []openAIMessage `json:"messages"`
}

type openAIMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type openAIChatResponse struct {
	Choices []struct {
		Message openAIMessage `json:"message"`
	} `json:"choices"`
}

func (s *TranslationService) callOpenAI(ctx context.Context, text, targetLang string) (string, error) {
	if s.openaiKey == "" {
		return "", fmt.Errorf("OpenAI API key not configured")
	}

	reqBody := openAIChatRequest{
		Model: "gpt-4o-mini",
		Messages: []openAIMessage{
			{
				Role:    "system",
				Content: fmt.Sprintf("You are a professional translator. Translate the following text to %s. Return only the translated text, nothing else.", targetLang),
			},
			{
				Role:    "user",
				Content: text,
			},
		},
	}

	body, _ := json.Marshal(reqBody)
	req, err := http.NewRequestWithContext(ctx, "POST", "https://api.openai.com/v1/chat/completions", bytes.NewReader(body))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+s.openaiKey)

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("calling OpenAI: %w", err)
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("OpenAI error %d: %s", resp.StatusCode, string(respBody))
	}

	var chatResp openAIChatResponse
	if err := json.Unmarshal(respBody, &chatResp); err != nil {
		return "", fmt.Errorf("decoding response: %w", err)
	}

	if len(chatResp.Choices) == 0 {
		return "", fmt.Errorf("no translation returned")
	}

	return chatResp.Choices[0].Message.Content, nil
}
