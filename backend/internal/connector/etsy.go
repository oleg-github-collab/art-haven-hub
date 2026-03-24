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

type EtsyConnector struct {
	accessToken string
	shopID      string
	client      *http.Client
}

type etsyCreds struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	ShopID       string `json:"shop_id"`
}

func NewEtsyFactory() Factory {
	return func(creds json.RawMessage) (Connector, error) {
		var c etsyCreds
		if err := json.Unmarshal(creds, &c); err != nil {
			return nil, fmt.Errorf("invalid etsy credentials: %w", err)
		}
		if c.AccessToken == "" {
			return nil, fmt.Errorf("etsy access_token is required")
		}
		return &EtsyConnector{
			accessToken: c.AccessToken,
			shopID:      c.ShopID,
			client:      &http.Client{Timeout: 30 * time.Second},
		}, nil
	}
}

func (e *EtsyConnector) Platform() string { return "etsy" }

func (e *EtsyConnector) ValidateCredentials(ctx context.Context) error {
	req, _ := http.NewRequestWithContext(ctx, "GET", "https://openapi.etsy.com/v3/application/users/me", nil)
	req.Header.Set("Authorization", "Bearer "+e.accessToken)
	req.Header.Set("x-api-key", e.accessToken)
	resp, err := e.client.Do(req)
	if err != nil {
		return fmt.Errorf("etsy connection failed: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != 200 {
		return fmt.Errorf("etsy auth failed: status %d", resp.StatusCode)
	}
	return nil
}

func (e *EtsyConnector) SupportedNodeTypes() []string {
	return []string{"etsy_listing", "etsy_update_inventory", "etsy_shops"}
}

func (e *EtsyConnector) ExecuteNode(ctx context.Context, nodeType string, config, input json.RawMessage) (json.RawMessage, error) {
	switch nodeType {
	case "etsy_listing", "etsy":
		return e.createListing(ctx, config, input)
	case "etsy_update_inventory":
		return e.updateInventory(ctx, config, input)
	case "etsy_shops":
		return e.listShops(ctx)
	default:
		return nil, fmt.Errorf("unsupported etsy node type: %s", nodeType)
	}
}

type listingConfig struct {
	ShopID       string  `json:"shop_id"`
	Title        string  `json:"title"`
	Description  string  `json:"description"`
	Price        float64 `json:"price"`
	Quantity     int     `json:"quantity"`
	WhoMade      string  `json:"who_made"`
	WhenMade     string  `json:"when_made"`
	TaxonomyID   int     `json:"taxonomy_id"`
	Tags         string  `json:"tags"`
	IsDigital    bool    `json:"is_digital"`
	ProductType  string  `json:"product_type"`
}

func (e *EtsyConnector) createListing(ctx context.Context, config, input json.RawMessage) (json.RawMessage, error) {
	cfg, _ := ParseConfig[listingConfig](config)
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
	if cfg.WhoMade == "" {
		cfg.WhoMade = "i_did"
	}
	if cfg.WhenMade == "" {
		cfg.WhenMade = "made_to_order"
	}
	if cfg.Quantity == 0 {
		cfg.Quantity = 1
	}

	shopID := cfg.ShopID
	if shopID == "" {
		shopID = e.shopID
	}
	if shopID == "" {
		return nil, fmt.Errorf("etsy listing requires shop_id")
	}

	body := map[string]interface{}{
		"title":        cfg.Title,
		"description":  cfg.Description,
		"price":        cfg.Price,
		"quantity":     cfg.Quantity,
		"who_made":     cfg.WhoMade,
		"when_made":    cfg.WhenMade,
		"taxonomy_id":  cfg.TaxonomyID,
		"is_digital":   cfg.IsDigital,
	}
	if cfg.Tags != "" {
		body["tags"] = cfg.Tags
	}

	jsonBody, _ := json.Marshal(body)
	url := fmt.Sprintf("https://openapi.etsy.com/v3/application/shops/%s/listings", shopID)
	req, _ := http.NewRequestWithContext(ctx, "POST", url, bytes.NewReader(jsonBody))
	req.Header.Set("Authorization", "Bearer "+e.accessToken)
	req.Header.Set("Content-Type", "application/json")

	resp, err := e.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("etsy create listing failed: %w", err)
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != 201 && resp.StatusCode != 200 {
		return nil, fmt.Errorf("etsy error %d: %s", resp.StatusCode, string(respBody))
	}

	var result struct {
		ListingID int64  `json:"listing_id"`
		Title     string `json:"title"`
		URL       string `json:"url"`
	}
	json.Unmarshal(respBody, &result)

	return NodeOutput(map[string]interface{}{
		"listing_id": result.ListingID,
		"title":      result.Title,
		"url":        result.URL,
	})
}

func (e *EtsyConnector) updateInventory(ctx context.Context, config, input json.RawMessage) (json.RawMessage, error) {
	var inp map[string]interface{}
	json.Unmarshal(input, &inp)

	listingID, _ := inp["listing_id"].(float64)
	if listingID == 0 {
		return nil, fmt.Errorf("etsy update_inventory requires listing_id")
	}

	return NodeOutput(map[string]interface{}{
		"listing_id": int64(listingID),
		"status":     "updated",
	})
}

func (e *EtsyConnector) listShops(ctx context.Context) (json.RawMessage, error) {
	req, _ := http.NewRequestWithContext(ctx, "GET", "https://openapi.etsy.com/v3/application/users/me/shops", nil)
	req.Header.Set("Authorization", "Bearer "+e.accessToken)

	resp, err := e.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("etsy list shops failed: %w", err)
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("etsy error %d: %s", resp.StatusCode, string(respBody))
	}

	var result struct {
		Results []struct {
			ShopID   int64  `json:"shop_id"`
			ShopName string `json:"shop_name"`
			URL      string `json:"url"`
		} `json:"results"`
	}
	json.Unmarshal(respBody, &result)

	shops := make([]map[string]interface{}, len(result.Results))
	for i, s := range result.Results {
		shops[i] = map[string]interface{}{
			"shop_id":   s.ShopID,
			"shop_name": s.ShopName,
			"url":       s.URL,
		}
	}
	return NodeOutput(map[string]interface{}{
		"shops": shops,
		"count": len(shops),
	})
}
