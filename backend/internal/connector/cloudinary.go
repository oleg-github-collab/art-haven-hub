package connector

import (
	"bytes"
	"context"
	"crypto/sha1"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"sort"
	"strconv"
	"strings"
	"time"
)

type CloudinaryConnector struct {
	cloudName string
	apiKey    string
	apiSecret string
	client    *http.Client
}

type cloudinaryCreds struct {
	CloudName string `json:"cloud_name"`
	APIKey    string `json:"api_key"`
	APISecret string `json:"api_secret"`
}

func NewCloudinaryFactory() Factory {
	return func(creds json.RawMessage) (Connector, error) {
		var c cloudinaryCreds
		if err := json.Unmarshal(creds, &c); err != nil {
			return nil, fmt.Errorf("invalid cloudinary credentials: %w", err)
		}
		if c.CloudName == "" || c.APIKey == "" || c.APISecret == "" {
			return nil, fmt.Errorf("cloudinary requires cloud_name, api_key, and api_secret")
		}
		return &CloudinaryConnector{
			cloudName: c.CloudName,
			apiKey:    c.APIKey,
			apiSecret: c.APISecret,
			client:    &http.Client{Timeout: 120 * time.Second},
		}, nil
	}
}

func (c *CloudinaryConnector) Platform() string { return "cloudinary" }

func (c *CloudinaryConnector) ValidateCredentials(ctx context.Context) error {
	url := fmt.Sprintf("https://api.cloudinary.com/v1_1/%s/resources/image?max_results=1", c.cloudName)
	req, _ := http.NewRequestWithContext(ctx, "GET", url, nil)
	req.SetBasicAuth(c.apiKey, c.apiSecret)
	resp, err := c.client.Do(req)
	if err != nil {
		return fmt.Errorf("cloudinary connection failed: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode == 401 {
		return fmt.Errorf("cloudinary auth failed: invalid credentials")
	}
	if resp.StatusCode != 200 {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("cloudinary error %d: %s", resp.StatusCode, string(body))
	}
	return nil
}

func (c *CloudinaryConnector) SupportedNodeTypes() []string {
	return []string{"cloudinary_upload", "cloudinary_transform", "cloudinary_optimize"}
}

func (c *CloudinaryConnector) ExecuteNode(ctx context.Context, nodeType string, config, input json.RawMessage) (json.RawMessage, error) {
	switch nodeType {
	case "cloudinary_upload":
		return c.upload(ctx, config, input)
	case "cloudinary_transform":
		return c.transform(ctx, config, input)
	case "cloudinary_optimize":
		return c.optimize(ctx, config, input)
	default:
		return nil, fmt.Errorf("unsupported cloudinary node type: %s", nodeType)
	}
}

type uploadConfig struct {
	Folder       string `json:"folder"`
	PublicID     string `json:"public_id"`
	Overwrite    bool   `json:"overwrite"`
	Tags         string `json:"tags"`
}

func (c *CloudinaryConnector) upload(ctx context.Context, config, input json.RawMessage) (json.RawMessage, error) {
	cfg, _ := ParseConfig[uploadConfig](config)
	var inp map[string]interface{}
	json.Unmarshal(input, &inp)

	imageURL, _ := inp["image_url"].(string)
	if imageURL == "" {
		imageURL, _ = inp["url"].(string)
	}
	if imageURL == "" {
		return nil, fmt.Errorf("cloudinary upload requires image_url in input")
	}

	timestamp := strconv.FormatInt(time.Now().Unix(), 10)
	params := map[string]string{
		"timestamp": timestamp,
	}
	if cfg.Folder != "" {
		params["folder"] = cfg.Folder
	}
	if cfg.PublicID != "" {
		params["public_id"] = cfg.PublicID
	}
	if cfg.Overwrite {
		params["overwrite"] = "true"
	}
	if cfg.Tags != "" {
		params["tags"] = cfg.Tags
	}

	signature := c.sign(params)

	var body bytes.Buffer
	writer := multipart.NewWriter(&body)
	writer.WriteField("file", imageURL)
	writer.WriteField("api_key", c.apiKey)
	writer.WriteField("timestamp", timestamp)
	writer.WriteField("signature", signature)
	for k, v := range params {
		if k != "timestamp" {
			writer.WriteField(k, v)
		}
	}
	writer.Close()

	url := fmt.Sprintf("https://api.cloudinary.com/v1_1/%s/image/upload", c.cloudName)
	req, _ := http.NewRequestWithContext(ctx, "POST", url, &body)
	req.Header.Set("Content-Type", writer.FormDataContentType())

	resp, err := c.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("cloudinary upload failed: %w", err)
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("cloudinary upload error %d: %s", resp.StatusCode, string(respBody))
	}

	var result struct {
		PublicID  string `json:"public_id"`
		URL      string `json:"url"`
		SecureURL string `json:"secure_url"`
		Width    int    `json:"width"`
		Height   int    `json:"height"`
		Format   string `json:"format"`
		Bytes    int    `json:"bytes"`
	}
	json.Unmarshal(respBody, &result)

	return NodeOutput(map[string]interface{}{
		"public_id":  result.PublicID,
		"url":        result.SecureURL,
		"width":      result.Width,
		"height":     result.Height,
		"format":     result.Format,
		"bytes":      result.Bytes,
		"thumbnail":  fmt.Sprintf("https://res.cloudinary.com/%s/image/upload/c_fill,w_400,h_400,f_auto,q_auto/%s", c.cloudName, result.PublicID),
		"optimized":  fmt.Sprintf("https://res.cloudinary.com/%s/image/upload/f_auto,q_auto,w_1200/%s", c.cloudName, result.PublicID),
	})
}

type transformConfig struct {
	Width   int    `json:"width"`
	Height  int    `json:"height"`
	Crop    string `json:"crop"`
	Quality string `json:"quality"`
	Format  string `json:"format"`
}

func (c *CloudinaryConnector) transform(_ context.Context, config, input json.RawMessage) (json.RawMessage, error) {
	cfg, _ := ParseConfig[transformConfig](config)
	var inp map[string]interface{}
	json.Unmarshal(input, &inp)

	publicID, _ := inp["public_id"].(string)
	if publicID == "" {
		return nil, fmt.Errorf("cloudinary transform requires public_id in input")
	}

	parts := []string{}
	if cfg.Width > 0 {
		parts = append(parts, fmt.Sprintf("w_%d", cfg.Width))
	}
	if cfg.Height > 0 {
		parts = append(parts, fmt.Sprintf("h_%d", cfg.Height))
	}
	if cfg.Crop != "" {
		parts = append(parts, "c_"+cfg.Crop)
	} else if cfg.Width > 0 || cfg.Height > 0 {
		parts = append(parts, "c_fill")
	}
	if cfg.Quality != "" {
		parts = append(parts, "q_"+cfg.Quality)
	} else {
		parts = append(parts, "q_auto")
	}
	if cfg.Format != "" {
		parts = append(parts, "f_"+cfg.Format)
	} else {
		parts = append(parts, "f_auto")
	}

	transform := strings.Join(parts, ",")
	url := fmt.Sprintf("https://res.cloudinary.com/%s/image/upload/%s/%s", c.cloudName, transform, publicID)

	return NodeOutput(map[string]interface{}{
		"url":        url,
		"public_id":  publicID,
		"transform":  transform,
	})
}

func (c *CloudinaryConnector) optimize(_ context.Context, config, input json.RawMessage) (json.RawMessage, error) {
	var inp map[string]interface{}
	json.Unmarshal(input, &inp)

	publicID, _ := inp["public_id"].(string)
	if publicID == "" {
		return nil, fmt.Errorf("cloudinary optimize requires public_id in input")
	}

	return NodeOutput(map[string]interface{}{
		"public_id":  publicID,
		"original":   fmt.Sprintf("https://res.cloudinary.com/%s/image/upload/%s", c.cloudName, publicID),
		"optimized":  fmt.Sprintf("https://res.cloudinary.com/%s/image/upload/f_auto,q_auto/%s", c.cloudName, publicID),
		"thumbnail":  fmt.Sprintf("https://res.cloudinary.com/%s/image/upload/c_fill,w_400,h_400,f_auto,q_auto/%s", c.cloudName, publicID),
		"medium":     fmt.Sprintf("https://res.cloudinary.com/%s/image/upload/f_auto,q_auto,w_800/%s", c.cloudName, publicID),
		"large":      fmt.Sprintf("https://res.cloudinary.com/%s/image/upload/f_auto,q_auto,w_1600/%s", c.cloudName, publicID),
		"lqip":       fmt.Sprintf("https://res.cloudinary.com/%s/image/upload/e_blur:1000,q_1,w_50,f_auto/%s", c.cloudName, publicID),
	})
}

func (c *CloudinaryConnector) sign(params map[string]string) string {
	keys := make([]string, 0, len(params))
	for k := range params {
		keys = append(keys, k)
	}
	sort.Strings(keys)

	var sb strings.Builder
	for i, k := range keys {
		if i > 0 {
			sb.WriteString("&")
		}
		sb.WriteString(k)
		sb.WriteString("=")
		sb.WriteString(params[k])
	}
	sb.WriteString(c.apiSecret)

	h := sha1.New()
	h.Write([]byte(sb.String()))
	return fmt.Sprintf("%x", h.Sum(nil))
}
