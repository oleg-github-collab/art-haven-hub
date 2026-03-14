package ws

import (
	"context"
	"encoding/json"
	"log/slog"
	"sync"

	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
)

// WSMessage is the wire protocol for WebSocket messages.
type WSMessage struct {
	Type    string          `json:"type"`
	Payload json.RawMessage `json:"payload"`
}

// Hub manages all active WebSocket connections and room subscriptions.
type Hub struct {
	mu      sync.RWMutex
	clients map[uuid.UUID]map[*Client]bool // userID -> set of clients
	rooms   map[uuid.UUID]map[*Client]bool // roomID (conversation) -> set of clients
	rdb     *redis.Client
}

func NewHub(rdb *redis.Client) *Hub {
	return &Hub{
		clients: make(map[uuid.UUID]map[*Client]bool),
		rooms:   make(map[uuid.UUID]map[*Client]bool),
		rdb:     rdb,
	}
}

func (h *Hub) Register(client *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if h.clients[client.UserID] == nil {
		h.clients[client.UserID] = make(map[*Client]bool)
	}
	h.clients[client.UserID][client] = true

	slog.Debug("ws client registered", "user_id", client.UserID)
}

func (h *Hub) Unregister(client *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if clients, ok := h.clients[client.UserID]; ok {
		delete(clients, client)
		if len(clients) == 0 {
			delete(h.clients, client.UserID)
		}
	}

	// Remove from all rooms
	for roomID, members := range h.rooms {
		delete(members, client)
		if len(members) == 0 {
			delete(h.rooms, roomID)
		}
	}

	slog.Debug("ws client unregistered", "user_id", client.UserID)
}

func (h *Hub) JoinRoom(client *Client, roomID uuid.UUID) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if h.rooms[roomID] == nil {
		h.rooms[roomID] = make(map[*Client]bool)
	}
	h.rooms[roomID][client] = true
}

func (h *Hub) LeaveRoom(client *Client, roomID uuid.UUID) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if members, ok := h.rooms[roomID]; ok {
		delete(members, client)
		if len(members) == 0 {
			delete(h.rooms, roomID)
		}
	}
}

// BroadcastToRoom sends a message to all clients in a room, optionally excluding one.
func (h *Hub) BroadcastToRoom(roomID uuid.UUID, msg WSMessage, excludeUserID *uuid.UUID) {
	data, err := json.Marshal(msg)
	if err != nil {
		slog.Error("ws marshal error", "error", err)
		return
	}

	h.mu.RLock()
	members := h.rooms[roomID]
	h.mu.RUnlock()

	for client := range members {
		if excludeUserID != nil && client.UserID == *excludeUserID {
			continue
		}
		client.Send(data)
	}

	// Also publish to Redis for multi-instance support
	if h.rdb != nil {
		h.rdb.Publish(context.Background(), "chat:"+roomID.String(), data)
	}
}

// SendToUser sends a message to all connections of a specific user.
func (h *Hub) SendToUser(userID uuid.UUID, msg WSMessage) {
	data, err := json.Marshal(msg)
	if err != nil {
		return
	}

	h.mu.RLock()
	clients := h.clients[userID]
	h.mu.RUnlock()

	for client := range clients {
		client.Send(data)
	}
}

// IsOnline checks if a user has any active WebSocket connections.
func (h *Hub) IsOnline(userID uuid.UUID) bool {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return len(h.clients[userID]) > 0
}
