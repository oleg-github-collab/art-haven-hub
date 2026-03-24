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

type PrintfulConnector struct {
	accessToken string
	client      *http.Client
}

type printfulCreds struct {
	AccessToken string `json:"access_token"`
}

func NewPrintfulFactory() Factory {
	return func(creds json.RawMessage) (Connector, error) {
		var c printfulCreds
		if err := json.Unmarshal(creds, &c); err != nil {
			return nil, fmt.Errorf("invalid printful credentials: %w", err)
		}
		if c.AccessToken == "" {
			return nil, fmt.Errorf("printful access_token is required")
		}
		return &PrintfulConnector{
			accessToken: c.AccessToken,
			client:      &http.Client{Timeout: 30 * time.Second},
		}, nil
	}
}

func (p *PrintfulConnector) Platform() string { return "printful" }

func (p *PrintfulConnector) ValidateCredentials(ctx context.Context) error {
	req, _ := http.NewRequestWithContext(ctx, "GET", "https://api.printful.com/store", nil)
	req.Header.Set("Authorization", "Bearer "+p.accessToken)
	resp, err := p.client.Do(req)
	if err != nil {
		return fmt.Errorf("printful connection failed: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != 200 {
		return fmt.Errorf("printful auth failed: status %d", resp.StatusCode)
	}
	return nil
}

func (p *PrintfulConnector) SupportedNodeTypes() []string {
	return []string{"printful_sync", "printful_mockup", "printful_products"}
}

func (p *PrintfulConnector) ExecuteNode(ctx context.Context, nodeType string, config, input json.RawMessage) (json.RawMessage, error) {
	switch nodeType {
	case "printful_sync":
		return p.syncProduct(ctx, config, input)
	case "printful_mockup":
		return p.generateMockup(ctx, config, input)
	case "printful_products":
		return p.listProducts(ctx)
	default:
		return nil, fmt.Errorf("unsupported printful node type: %s", nodeType)
	}
}

type syncConfig struct {
	ProductType string  `json:"product_type"`
	Title       string  `json:"title"`
	Description string  `json:"description"`
	Price       float64 `json:"retail_price"`
	VariantID   int     `json:"variant_id"`
}

func (p *PrintfulConnector) syncProduct(ctx context.Context, config, input json.RawMessage) (json.RawMessage, error) {
	cfg, _ := ParseConfig[syncConfig](config)
	var inp map[string]interface{}
	json.Unmarshal(input, &inp)

	imageURL, _ := inp["image_url"].(string)
	if imageURL == "" {
		imageURL, _ = inp["optimized"].(string)
	}
	if imageURL == "" {
		imageURL, _ = inp["url"].(string)
	}

	if cfg.Title == "" {
		cfg.Title, _ = inp["title"].(string)
	}

	// Default to poster variant
	if cfg.VariantID == 0 {
		cfg.VariantID = 1
	}

	body := map[string]interface{}{
		"sync_product": map[string]interface{}{
			"name": cfg.Title,
		},
		"sync_variants": []map[string]interface{}{
			{
				"variant_id":   cfg.VariantID,
				"retail_price": fmt.Sprintf("%.2f", cfg.Price),
				"files": []map[string]interface{}{
					{
						"type": "default",
						"url":  imageURL,
					},
				},
			},
		},
	}

	jsonBody, _ := json.Marshal(body)
	req, _ := http.NewRequestWithContext(ctx, "POST", "https://api.printful.com/store/products", bytes.NewReader(jsonBody))
	req.Header.Set("Authorization", "Bearer "+p.accessToken)
	req.Header.Set("Content-Type", "application/json")

	resp, err := p.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("printful sync product failed: %w", err)
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("printful error %d: %s", resp.StatusCode, string(respBody))
	}

	var result struct {
		Result struct {
			ID          int64  `json:"id"`
			ExternalID  string `json:"external_id"`
			Name        string `json:"name"`
			Synced      int    `json:"synced"`
		} `json:"result"`
	}
	json.Unmarshal(respBody, &result)

	return NodeOutput(map[string]interface{}{
		"product_id":  result.Result.ID,
		"external_id": result.Result.ExternalID,
		"name":        result.Result.Name,
	})
}

type mockupConfig struct {
	ProductID int `json:"product_id"`
	VariantID int `json:"variant_id"`
}

func (p *PrintfulConnector) generateMockup(ctx context.Context, config, input json.RawMessage) (json.RawMessage, error) {
	cfg, _ := ParseConfig[mockupConfig](config)
	var inp map[string]interface{}
	json.Unmarshal(input, &inp)

	imageURL, _ := inp["image_url"].(string)
	if imageURL == "" {
		imageURL, _ = inp["url"].(string)
	}

	if cfg.ProductID == 0 {
		cfg.ProductID = 1 // poster
	}

	body := map[string]interface{}{
		"variant_ids": []int{cfg.VariantID},
		"files": []map[string]interface{}{
			{
				"placement": "default",
				"image_url": imageURL,
			},
		},
	}

	jsonBody, _ := json.Marshal(body)
	url := fmt.Sprintf("https://api.printful.com/mockup-generator/create-task/%d", cfg.ProductID)
	req, _ := http.NewRequestWithContext(ctx, "POST", url, bytes.NewReader(jsonBody))
	req.Header.Set("Authorization", "Bearer "+p.accessToken)
	req.Header.Set("Content-Type", "application/json")

	resp, err := p.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("printful mockup failed: %w", err)
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("printful mockup error %d: %s", resp.StatusCode, string(respBody))
	}

	var result struct {
		Result struct {
			TaskKey string `json:"task_key"`
			Status  string `json:"status"`
		} `json:"result"`
	}
	json.Unmarshal(respBody, &result)

	return NodeOutput(map[string]interface{}{
		"task_key": result.Result.TaskKey,
		"status":   result.Result.Status,
	})
}

func (p *PrintfulConnector) listProducts(ctx context.Context) (json.RawMessage, error) {
	req, _ := http.NewRequestWithContext(ctx, "GET", "https://api.printful.com/store/products?limit=50", nil)
	req.Header.Set("Authorization", "Bearer "+p.accessToken)

	resp, err := p.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("printful list products failed: %w", err)
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("printful error %d: %s", resp.StatusCode, string(respBody))
	}

	var result struct {
		Result []struct {
			ID   int64  `json:"id"`
			Name string `json:"name"`
		} `json:"result"`
	}
	json.Unmarshal(respBody, &result)

	products := make([]map[string]interface{}, len(result.Result))
	for i, p := range result.Result {
		products[i] = map[string]interface{}{
			"id":   p.ID,
			"name": p.Name,
		}
	}
	return NodeOutput(map[string]interface{}{
		"products": products,
		"count":    len(products),
	})
}
