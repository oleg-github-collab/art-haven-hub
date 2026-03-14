package ws

import (
	"context"
	"encoding/json"
	"log/slog"
	"time"

	"github.com/google/uuid"
	"nhooyr.io/websocket"
)

const (
	writeTimeout = 10 * time.Second
	pongWait     = 60 * time.Second
	pingInterval = 30 * time.Second
	maxMsgSize   = 65536
)

type Client struct {
	UserID uuid.UUID
	conn   *websocket.Conn
	hub    *Hub
	send   chan []byte
}

func NewClient(userID uuid.UUID, conn *websocket.Conn, hub *Hub) *Client {
	return &Client{
		UserID: userID,
		conn:   conn,
		hub:    hub,
		send:   make(chan []byte, 256),
	}
}

func (c *Client) Send(data []byte) {
	select {
	case c.send <- data:
	default:
		slog.Warn("ws client send buffer full, dropping", "user_id", c.UserID)
	}
}

// ReadPump reads messages from the WebSocket and dispatches them.
func (c *Client) ReadPump(ctx context.Context) {
	defer func() {
		c.hub.Unregister(c)
		c.conn.Close(websocket.StatusNormalClosure, "")
	}()

	c.conn.SetReadLimit(maxMsgSize)

	for {
		_, data, err := c.conn.Read(ctx)
		if err != nil {
			if websocket.CloseStatus(err) != websocket.StatusNormalClosure {
				slog.Debug("ws read error", "user_id", c.UserID, "error", err)
			}
			return
		}

		var msg WSMessage
		if err := json.Unmarshal(data, &msg); err != nil {
			slog.Debug("ws invalid message", "user_id", c.UserID, "error", err)
			continue
		}

		c.handleMessage(ctx, msg)
	}
}

// WritePump sends messages from the send channel to the WebSocket.
func (c *Client) WritePump(ctx context.Context) {
	ticker := time.NewTicker(pingInterval)
	defer func() {
		ticker.Stop()
		c.conn.Close(websocket.StatusNormalClosure, "")
	}()

	for {
		select {
		case data, ok := <-c.send:
			if !ok {
				return
			}
			writeCtx, cancel := context.WithTimeout(ctx, writeTimeout)
			err := c.conn.Write(writeCtx, websocket.MessageText, data)
			cancel()
			if err != nil {
				return
			}

		case <-ticker.C:
			pingCtx, cancel := context.WithTimeout(ctx, writeTimeout)
			err := c.conn.Ping(pingCtx)
			cancel()
			if err != nil {
				return
			}

		case <-ctx.Done():
			return
		}
	}
}

func (c *Client) handleMessage(ctx context.Context, msg WSMessage) {
	switch msg.Type {
	case "join_room":
		var payload struct {
			RoomID uuid.UUID `json:"room_id"`
		}
		if json.Unmarshal(msg.Payload, &payload) == nil {
			c.hub.JoinRoom(c, payload.RoomID)
		}

	case "leave_room":
		var payload struct {
			RoomID uuid.UUID `json:"room_id"`
		}
		if json.Unmarshal(msg.Payload, &payload) == nil {
			c.hub.LeaveRoom(c, payload.RoomID)
		}

	case "typing":
		var payload struct {
			RoomID uuid.UUID `json:"room_id"`
		}
		if json.Unmarshal(msg.Payload, &payload) == nil {
			typingPayload, _ := json.Marshal(map[string]interface{}{
				"room_id": payload.RoomID,
				"user_id": c.UserID,
			})
			c.hub.BroadcastToRoom(payload.RoomID, WSMessage{
				Type:    "typing",
				Payload: typingPayload,
			}, &c.UserID)
		}

	default:
		slog.Debug("ws unknown message type", "type", msg.Type, "user_id", c.UserID)
	}
}
