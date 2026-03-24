package connector

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

type OpenAIConnector struct {
	apiKey string
	client *http.Client
}

type openAICreds struct {
	APIKey string `json:"api_key"`
}

func NewOpenAIFactory() Factory {
	return func(creds json.RawMessage) (Connector, error) {
		var c openAICreds
		if err := json.Unmarshal(creds, &c); err != nil {
			return nil, fmt.Errorf("invalid openai credentials: %w", err)
		}
		if c.APIKey == "" {
			return nil, fmt.Errorf("openai api_key is required")
		}
		return &OpenAIConnector{
			apiKey: c.APIKey,
			client: &http.Client{Timeout: 60 * time.Second},
		}, nil
	}
}

func (o *OpenAIConnector) Platform() string { return "openai" }

func (o *OpenAIConnector) ValidateCredentials(ctx context.Context) error {
	req, _ := http.NewRequestWithContext(ctx, "GET", "https://api.openai.com/v1/models", nil)
	req.Header.Set("Authorization", "Bearer "+o.apiKey)
	resp, err := o.client.Do(req)
	if err != nil {
		return fmt.Errorf("openai connection failed: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != 200 {
		return fmt.Errorf("openai auth failed: status %d", resp.StatusCode)
	}
	return nil
}

func (o *OpenAIConnector) SupportedNodeTypes() []string {
	return []string{"ai_adapt", "ai_hashtags", "ai_translate", "ai_image_edit", "ai_caption", "ai_describe"}
}

func (o *OpenAIConnector) ExecuteNode(ctx context.Context, nodeType string, config, input json.RawMessage) (json.RawMessage, error) {
	switch nodeType {
	case "ai_caption", "ai_adapt":
		return o.generateCaption(ctx, config, input)
	case "ai_hashtags":
		return o.generateHashtags(ctx, config, input)
	case "ai_translate":
		return o.translate(ctx, config, input)
	case "ai_describe":
		return o.describe(ctx, config, input)
	default:
		return nil, fmt.Errorf("unsupported openai node type: %s", nodeType)
	}
}

type captionConfig struct {
	Tone     string `json:"tone"`
	MaxWords int    `json:"max_words"`
}

func (o *OpenAIConnector) generateCaption(ctx context.Context, config, input json.RawMessage) (json.RawMessage, error) {
	cfg, _ := ParseConfig[captionConfig](config)
	if cfg.Tone == "" {
		cfg.Tone = "professional"
	}
	if cfg.MaxWords == 0 {
		cfg.MaxWords = 50
	}

	var inp map[string]interface{}
	json.Unmarshal(input, &inp)

	title, _ := inp["title"].(string)
	description, _ := inp["description"].(string)

	prompt := fmt.Sprintf(
		"Generate a %s social media caption (max %d words) for an artwork titled '%s'.",
		cfg.Tone, cfg.MaxWords, title,
	)
	if description != "" {
		prompt += " Description: " + description
	}

	text, err := o.chatCompletion(ctx, prompt)
	if err != nil {
		return nil, err
	}
	return NodeOutput(map[string]interface{}{
		"caption": text,
		"tone":    cfg.Tone,
	})
}

type hashtagConfig struct {
	MaxHashtags int    `json:"max_hashtags"`
	Language    string `json:"language"`
}

func (o *OpenAIConnector) generateHashtags(ctx context.Context, config, input json.RawMessage) (json.RawMessage, error) {
	cfg, _ := ParseConfig[hashtagConfig](config)
	if cfg.MaxHashtags == 0 {
		cfg.MaxHashtags = 15
	}

	var inp map[string]interface{}
	json.Unmarshal(input, &inp)

	title, _ := inp["title"].(string)
	caption, _ := inp["caption"].(string)
	tags, _ := inp["tags"].([]interface{})

	context := title
	if caption != "" {
		context += ". " + caption
	}
	if len(tags) > 0 {
		tagStrs := make([]string, len(tags))
		for i, t := range tags {
			tagStrs[i], _ = t.(string)
		}
		context += ". Tags: " + strings.Join(tagStrs, ", ")
	}

	prompt := fmt.Sprintf(
		"Generate exactly %d relevant hashtags for this artwork: %s. Return only hashtags separated by spaces, each starting with #.",
		cfg.MaxHashtags, context,
	)

	text, err := o.chatCompletion(ctx, prompt)
	if err != nil {
		return nil, err
	}

	hashtags := strings.Fields(text)
	return NodeOutput(map[string]interface{}{
		"hashtags": hashtags,
		"count":    len(hashtags),
	})
}

type translateConfig struct {
	TargetLanguage string `json:"target_language"`
}

func (o *OpenAIConnector) translate(ctx context.Context, config, input json.RawMessage) (json.RawMessage, error) {
	cfg, _ := ParseConfig[translateConfig](config)
	if cfg.TargetLanguage == "" {
		cfg.TargetLanguage = "English"
	}

	var inp map[string]interface{}
	json.Unmarshal(input, &inp)
	text, _ := inp["text"].(string)
	if text == "" {
		text, _ = inp["caption"].(string)
	}

	prompt := fmt.Sprintf("Translate the following text to %s. Return only the translation:\n\n%s", cfg.TargetLanguage, text)
	result, err := o.chatCompletion(ctx, prompt)
	if err != nil {
		return nil, err
	}
	return NodeOutput(map[string]interface{}{
		"translated_text": result,
		"language":        cfg.TargetLanguage,
	})
}

func (o *OpenAIConnector) describe(ctx context.Context, config, input json.RawMessage) (json.RawMessage, error) {
	var inp map[string]interface{}
	json.Unmarshal(input, &inp)
	imageURL, _ := inp["image_url"].(string)

	prompt := "Describe this artwork in detail for an art marketplace listing. Include style, medium, colors, mood, and subject."
	if imageURL != "" {
		prompt += "\nImage URL: " + imageURL
	}

	text, err := o.chatCompletion(ctx, prompt)
	if err != nil {
		return nil, err
	}
	return NodeOutput(map[string]interface{}{
		"description": text,
	})
}

func (o *OpenAIConnector) chatCompletion(ctx context.Context, prompt string) (string, error) {
	body := map[string]interface{}{
		"model": "gpt-4o-mini",
		"messages": []map[string]string{
			{"role": "system", "content": "You are a helpful assistant for artists. Be concise and creative."},
			{"role": "user", "content": prompt},
		},
		"max_tokens":  500,
		"temperature": 0.7,
	}

	jsonBody, _ := json.Marshal(body)
	req, _ := http.NewRequestWithContext(ctx, "POST", "https://api.openai.com/v1/chat/completions", bytes.NewReader(jsonBody))
	req.Header.Set("Authorization", "Bearer "+o.apiKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := o.client.Do(req)
	if err != nil {
		return "", fmt.Errorf("openai request failed: %w", err)
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != 200 {
		return "", fmt.Errorf("openai error %d: %s", resp.StatusCode, string(respBody))
	}

	var result struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
	}
	if err := json.Unmarshal(respBody, &result); err != nil {
		return "", err
	}
	if len(result.Choices) == 0 {
		return "", fmt.Errorf("no choices in openai response")
	}
	return strings.TrimSpace(result.Choices[0].Message.Content), nil
}
