package connector

import (
	"context"
	"encoding/json"
	"fmt"
	"sync"
)

// Connector defines the interface every platform connector must implement.
type Connector interface {
	Platform() string
	ValidateCredentials(ctx context.Context) error
	ExecuteNode(ctx context.Context, nodeType string, config json.RawMessage, input json.RawMessage) (json.RawMessage, error)
	SupportedNodeTypes() []string
}

// Factory creates a connector from stored credentials.
type Factory func(creds json.RawMessage) (Connector, error)

// Registry manages connector factories and creates connector instances.
type Registry struct {
	mu        sync.RWMutex
	factories map[string]Factory
}

// NewRegistry creates a new connector registry.
func NewRegistry() *Registry {
	return &Registry{
		factories: make(map[string]Factory),
	}
}

// Register adds a connector factory.
func (r *Registry) Register(platform string, factory Factory) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.factories[platform] = factory
}

// Create instantiates a connector for the given platform.
func (r *Registry) Create(platform string, creds json.RawMessage) (Connector, error) {
	r.mu.RLock()
	factory, ok := r.factories[platform]
	r.mu.RUnlock()
	if !ok {
		return nil, fmt.Errorf("unknown connector platform: %s", platform)
	}
	return factory(creds)
}

// Platforms returns all registered platform names.
func (r *Registry) Platforms() []string {
	r.mu.RLock()
	defer r.mu.RUnlock()
	platforms := make([]string, 0, len(r.factories))
	for p := range r.factories {
		platforms = append(platforms, p)
	}
	return platforms
}

// HasPlatform checks if a platform is registered.
func (r *Registry) HasPlatform(platform string) bool {
	r.mu.RLock()
	defer r.mu.RUnlock()
	_, ok := r.factories[platform]
	return ok
}

// NodeOutput is a helper for building JSON output from connectors.
func NodeOutput(data map[string]interface{}) (json.RawMessage, error) {
	return json.Marshal(data)
}

// ParseConfig is a generic helper for parsing node config.
func ParseConfig[T any](raw json.RawMessage) (T, error) {
	var cfg T
	if len(raw) == 0 || string(raw) == "null" || string(raw) == "{}" {
		return cfg, nil
	}
	err := json.Unmarshal(raw, &cfg)
	return cfg, err
}

// ParseInput is a generic helper for parsing node input.
func ParseInput[T any](raw json.RawMessage) (T, error) {
	var inp T
	if len(raw) == 0 || string(raw) == "null" || string(raw) == "{}" {
		return inp, nil
	}
	err := json.Unmarshal(raw, &inp)
	return inp, err
}
