package connector

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

type PinterestConnector struct {
	accessToken string
	client      *http.Client
}

type pinterestCreds struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
}

func NewPinterestFactory() Factory {
	return func(creds json.RawMessage) (Connector, error) {
		var c pinterestCreds
		if err := json.Unmarshal(creds, &c); err != nil {
			return nil, fmt.Errorf("invalid pinterest credentials: %w", err)
		}
		if c.AccessToken == "" {
			return nil, fmt.Errorf("pinterest access_token is required")
		}
		return &PinterestConnector{
			accessToken: c.AccessToken,
			client:      &http.Client{Timeout: 30 * time.Second},
		}, nil
	}
}

func (p *PinterestConnector) Platform() string { return "pinterest" }

func (p *PinterestConnector) ValidateCredentials(ctx context.Context) error {
	req, _ := http.NewRequestWithContext(ctx, "GET", "https://api.pinterest.com/v5/user_account", nil)
	req.Header.Set("Authorization", "Bearer "+p.accessToken)
	resp, err := p.client.Do(req)
	if err != nil {
		return fmt.Errorf("pinterest connection failed: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != 200 {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("pinterest auth failed %d: %s", resp.StatusCode, string(body))
	}
	return nil
}

func (p *PinterestConnector) SupportedNodeTypes() []string {
	return []string{"pinterest_pin", "pinterest_boards"}
}

func (p *PinterestConnector) ExecuteNode(ctx context.Context, nodeType string, config, input json.RawMessage) (json.RawMessage, error) {
	switch nodeType {
	case "pinterest_pin", "pinterest":
		return p.createPin(ctx, config, input)
	case "pinterest_boards":
		return p.listBoards(ctx)
	default:
		return nil, fmt.Errorf("unsupported pinterest node type: %s", nodeType)
	}
}

type pinConfig struct {
	BoardID     string `json:"board_id"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Link        string `json:"link"`
	AltText     string `json:"alt_text"`
}

func (p *PinterestConnector) createPin(ctx context.Context, config, input json.RawMessage) (json.RawMessage, error) {
	cfg, _ := ParseConfig[pinConfig](config)
	var inp map[string]interface{}
	json.Unmarshal(input, &inp)

	imageURL, _ := inp["image_url"].(string)
	if imageURL == "" {
		imageURL, _ = inp["url"].(string)
	}
	if imageURL == "" {
		imageURL, _ = inp["optimized"].(string)
	}

	if cfg.Title == "" {
		cfg.Title, _ = inp["title"].(string)
	}
	if cfg.Description == "" {
		cfg.Description, _ = inp["caption"].(string)
		if cfg.Description == "" {
			cfg.Description, _ = inp["description"].(string)
		}
	}

	if cfg.BoardID == "" {
		return nil, fmt.Errorf("pinterest pin requires board_id in config")
	}
	if imageURL == "" {
		return nil, fmt.Errorf("pinterest pin requires image_url in input")
	}

	body := map[string]interface{}{
		"board_id": cfg.BoardID,
		"title":    cfg.Title,
		"media_source": map[string]interface{}{
			"source_type": "image_url",
			"url":         imageURL,
		},
	}
	if cfg.Description != "" {
		body["description"] = cfg.Description
	}
	if cfg.Link != "" {
		body["link"] = cfg.Link
	}
	if cfg.AltText != "" {
		body["alt_text"] = cfg.AltText
	}

	jsonBody, _ := json.Marshal(body)
	req, _ := http.NewRequestWithContext(ctx, "POST", "https://api.pinterest.com/v5/pins", bytes.NewReader(jsonBody))
	req.Header.Set("Authorization", "Bearer "+p.accessToken)
	req.Header.Set("Content-Type", "application/json")

	resp, err := p.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("pinterest create pin failed: %w", err)
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != 201 && resp.StatusCode != 200 {
		return nil, fmt.Errorf("pinterest error %d: %s", resp.StatusCode, string(respBody))
	}

	var result struct {
		ID    string `json:"id"`
		Title string `json:"title"`
		Link  string `json:"link"`
	}
	json.Unmarshal(respBody, &result)

	return NodeOutput(map[string]interface{}{
		"pin_id":    result.ID,
		"pin_title": result.Title,
		"pin_url":   fmt.Sprintf("https://www.pinterest.com/pin/%s/", result.ID),
	})
}

func (p *PinterestConnector) listBoards(ctx context.Context) (json.RawMessage, error) {
	req, _ := http.NewRequestWithContext(ctx, "GET", "https://api.pinterest.com/v5/boards?page_size=50", nil)
	req.Header.Set("Authorization", "Bearer "+p.accessToken)

	resp, err := p.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("pinterest list boards failed: %w", err)
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("pinterest error %d: %s", resp.StatusCode, string(respBody))
	}

	var result struct {
		Items []struct {
			ID   string `json:"id"`
			Name string `json:"name"`
		} `json:"items"`
	}
	json.Unmarshal(respBody, &result)

	boards := make([]map[string]string, len(result.Items))
	for i, b := range result.Items {
		boards[i] = map[string]string{"id": b.ID, "name": b.Name}
	}

	return NodeOutput(map[string]interface{}{
		"boards": boards,
		"count":  len(boards),
	})
}
