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

type ShopifyConnector struct {
	accessToken string
	shopDomain  string
	client      *http.Client
}

type shopifyCreds struct {
	AccessToken string `json:"access_token"`
	ShopDomain  string `json:"shop_domain"`
}

func NewShopifyFactory() Factory {
	return func(creds json.RawMessage) (Connector, error) {
		var c shopifyCreds
		if err := json.Unmarshal(creds, &c); err != nil {
			return nil, fmt.Errorf("invalid shopify credentials: %w", err)
		}
		if c.AccessToken == "" || c.ShopDomain == "" {
			return nil, fmt.Errorf("shopify requires access_token and shop_domain")
		}
		return &ShopifyConnector{
			accessToken: c.AccessToken,
			shopDomain:  c.ShopDomain,
			client:      &http.Client{Timeout: 30 * time.Second},
		}, nil
	}
}

func (s *ShopifyConnector) Platform() string { return "shopify" }

func (s *ShopifyConnector) ValidateCredentials(ctx context.Context) error {
	url := fmt.Sprintf("https://%s/admin/api/2024-01/shop.json", s.shopDomain)
	req, _ := http.NewRequestWithContext(ctx, "GET", url, nil)
	req.Header.Set("X-Shopify-Access-Token", s.accessToken)
	resp, err := s.client.Do(req)
	if err != nil {
		return fmt.Errorf("shopify connection failed: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != 200 {
		return fmt.Errorf("shopify auth failed: status %d", resp.StatusCode)
	}
	return nil
}

func (s *ShopifyConnector) SupportedNodeTypes() []string {
	return []string{"shopify_product", "shopify_collections"}
}

func (s *ShopifyConnector) ExecuteNode(ctx context.Context, nodeType string, config, input json.RawMessage) (json.RawMessage, error) {
	switch nodeType {
	case "shopify_product", "shopify":
		return s.createProduct(ctx, config, input)
	case "shopify_collections":
		return s.listCollections(ctx)
	default:
		return nil, fmt.Errorf("unsupported shopify node type: %s", nodeType)
	}
}

type productConfig struct {
	Title       string  `json:"title"`
	Description string  `json:"description"`
	Price       float64 `json:"price"`
	ProductType string  `json:"product_type"`
	Vendor      string  `json:"vendor"`
	Tags        string  `json:"tags"`
	Published   bool    `json:"published"`
}

func (s *ShopifyConnector) createProduct(ctx context.Context, config, input json.RawMessage) (json.RawMessage, error) {
	cfg, _ := ParseConfig[productConfig](config)
	var inp map[string]interface{}
	json.Unmarshal(input, &inp)

	if cfg.Title == "" {
		cfg.Title, _ = inp["title"].(string)
	}
	if cfg.Description == "" {
		cfg.Description, _ = inp["description"].(string)
		if cfg.Description == "" {
			cfg.Description, _ = inp["caption"].(string)
		}
	}
	if cfg.ProductType == "" {
		cfg.ProductType = "Art Print"
	}

	imageURL, _ := inp["image_url"].(string)
	if imageURL == "" {
		imageURL, _ = inp["optimized"].(string)
	}
	if imageURL == "" {
		imageURL, _ = inp["url"].(string)
	}

	product := map[string]interface{}{
		"title":        cfg.Title,
		"body_html":    cfg.Description,
		"product_type": cfg.ProductType,
		"published":    cfg.Published,
	}
	if cfg.Vendor != "" {
		product["vendor"] = cfg.Vendor
	}
	if cfg.Tags != "" {
		product["tags"] = cfg.Tags
	}
	if cfg.Price > 0 {
		product["variants"] = []map[string]interface{}{
			{"price": fmt.Sprintf("%.2f", cfg.Price)},
		}
	}
	if imageURL != "" {
		product["images"] = []map[string]string{
			{"src": imageURL},
		}
	}

	body := map[string]interface{}{"product": product}
	jsonBody, _ := json.Marshal(body)

	url := fmt.Sprintf("https://%s/admin/api/2024-01/products.json", s.shopDomain)
	req, _ := http.NewRequestWithContext(ctx, "POST", url, bytes.NewReader(jsonBody))
	req.Header.Set("X-Shopify-Access-Token", s.accessToken)
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("shopify create product failed: %w", err)
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != 201 && resp.StatusCode != 200 {
		return nil, fmt.Errorf("shopify error %d: %s", resp.StatusCode, string(respBody))
	}

	var result struct {
		Product struct {
			ID    int64  `json:"id"`
			Title string `json:"title"`
		} `json:"product"`
	}
	json.Unmarshal(respBody, &result)

	return NodeOutput(map[string]interface{}{
		"product_id": result.Product.ID,
		"title":      result.Product.Title,
		"url":        fmt.Sprintf("https://%s/products/%d", s.shopDomain, result.Product.ID),
	})
}

func (s *ShopifyConnector) listCollections(ctx context.Context) (json.RawMessage, error) {
	url := fmt.Sprintf("https://%s/admin/api/2024-01/custom_collections.json?limit=50", s.shopDomain)
	req, _ := http.NewRequestWithContext(ctx, "GET", url, nil)
	req.Header.Set("X-Shopify-Access-Token", s.accessToken)

	resp, err := s.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("shopify list collections failed: %w", err)
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("shopify error %d: %s", resp.StatusCode, string(respBody))
	}

	var result struct {
		Collections []struct {
			ID    int64  `json:"id"`
			Title string `json:"title"`
		} `json:"custom_collections"`
	}
	json.Unmarshal(respBody, &result)

	collections := make([]map[string]interface{}, len(result.Collections))
	for i, c := range result.Collections {
		collections[i] = map[string]interface{}{
			"id":    c.ID,
			"title": c.Title,
		}
	}
	return NodeOutput(map[string]interface{}{
		"collections": collections,
		"count":       len(collections),
	})
}
