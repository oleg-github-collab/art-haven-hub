package service

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"sync"
	"time"

	"github.com/art-haven-hub/backend/internal/model"
	"github.com/art-haven-hub/backend/internal/repository"
	"github.com/art-haven-hub/backend/internal/ws"
	"github.com/google/uuid"
)

type CallService struct {
	callRepo      *repository.CallRepo
	messengerRepo *repository.MessengerRepo
	hub           *ws.Hub
	callTimeout   time.Duration
	stunServers   []string
	turnServers   []string
	turnUsername   string
	turnPassword  string

	mu          sync.RWMutex
	activeCalls map[uuid.UUID]*activeCall
}

type activeCall struct {
	CallID   uuid.UUID
	CallerID uuid.UUID
	CalleeID uuid.UUID
	Timer    *time.Timer
}

type ICEServer struct {
	URLs       []string `json:"urls"`
	Username   string   `json:"username,omitempty"`
	Credential string   `json:"credential,omitempty"`
}

func NewCallService(
	callRepo *repository.CallRepo,
	messengerRepo *repository.MessengerRepo,
	hub *ws.Hub,
	callTimeout time.Duration,
	stunServers []string,
	turnServers []string,
	turnUsername string,
	turnPassword string,
) *CallService {
	return &CallService{
		callRepo:      callRepo,
		messengerRepo: messengerRepo,
		hub:           hub,
		callTimeout:   callTimeout,
		stunServers:   stunServers,
		turnServers:   turnServers,
		turnUsername:   turnUsername,
		turnPassword:  turnPassword,
		activeCalls:   make(map[uuid.UUID]*activeCall),
	}
}

func (s *CallService) GetICEServers() []ICEServer {
	servers := []ICEServer{}

	if len(s.stunServers) > 0 {
		servers = append(servers, ICEServer{URLs: s.stunServers})
	}

	if len(s.turnServers) > 0 {
		servers = append(servers, ICEServer{
			URLs:       s.turnServers,
			Username:   s.turnUsername,
			Credential: s.turnPassword,
		})
	}

	return servers
}

func (s *CallService) InitiateCall(ctx context.Context, callerID, calleeID, conversationID uuid.UUID, callType string) error {
	// Validate call type
	if callType != "audio" && callType != "video" {
		callType = "audio"
	}

	// Check membership
	isMember, err := s.messengerRepo.IsMember(ctx, conversationID, callerID)
	if err != nil || !isMember {
		return fmt.Errorf("not a conversation member")
	}

	// Check if either party is already in a call
	existing, _ := s.callRepo.GetActiveCallForUser(ctx, callerID)
	if existing != nil {
		return fmt.Errorf("you are already in a call")
	}
	existing, _ = s.callRepo.GetActiveCallForUser(ctx, calleeID)
	if existing != nil {
		return fmt.Errorf("user is already in a call")
	}

	// Create call record
	call := &model.Call{
		ConversationID: conversationID,
		CallerID:       callerID,
		CalleeID:       calleeID,
		CallType:       callType,
		Status:         "ringing",
	}
	if err := s.callRepo.Create(ctx, call); err != nil {
		return fmt.Errorf("creating call: %w", err)
	}

	// Get caller info for notification
	caller, _ := s.messengerRepo.GetUserByID(ctx, callerID)
	callerName := "Unknown"
	callerAvatar := ""
	if caller != nil {
		callerName = caller.Name
		if caller.AvatarURL != nil {
			callerAvatar = *caller.AvatarURL
		}
	}

	// Track active call with ring timeout
	timer := time.AfterFunc(s.callTimeout, func() {
		s.handleRingTimeout(call.ID)
	})

	s.mu.Lock()
	s.activeCalls[call.ID] = &activeCall{
		CallID:   call.ID,
		CallerID: callerID,
		CalleeID: calleeID,
		Timer:    timer,
	}
	s.mu.Unlock()

	// Send incoming call notification to callee
	payload, _ := json.Marshal(map[string]interface{}{
		"call_id":         call.ID,
		"caller_id":       callerID,
		"caller_name":     callerName,
		"caller_avatar":   callerAvatar,
		"conversation_id": conversationID,
		"call_type":       callType,
	})
	s.hub.SendToUser(calleeID, ws.WSMessage{
		Type:    "call_incoming",
		Payload: payload,
	})

	slog.Info("call initiated", "call_id", call.ID, "caller", callerID, "callee", calleeID, "type", callType)
	return nil
}

func (s *CallService) AcceptCall(ctx context.Context, callID, userID uuid.UUID) error {
	call, err := s.callRepo.GetByID(ctx, callID)
	if err != nil || call == nil {
		return fmt.Errorf("call not found")
	}
	if call.CalleeID != userID {
		return fmt.Errorf("not the callee")
	}
	if call.Status != "ringing" {
		return fmt.Errorf("call is not ringing")
	}

	// Update DB
	if err := s.callRepo.SetConnected(ctx, callID); err != nil {
		return fmt.Errorf("accepting call: %w", err)
	}

	// Cancel ring timeout
	s.mu.Lock()
	if ac, ok := s.activeCalls[callID]; ok {
		ac.Timer.Stop()
	}
	s.mu.Unlock()

	// Notify caller
	payload, _ := json.Marshal(map[string]interface{}{
		"call_id": callID,
	})
	s.hub.SendToUser(call.CallerID, ws.WSMessage{
		Type:    "call_accepted",
		Payload: payload,
	})

	slog.Info("call accepted", "call_id", callID)
	return nil
}

func (s *CallService) RejectCall(ctx context.Context, callID, userID uuid.UUID, reason string) error {
	call, err := s.callRepo.GetByID(ctx, callID)
	if err != nil || call == nil {
		return fmt.Errorf("call not found")
	}
	if call.CalleeID != userID {
		return fmt.Errorf("not the callee")
	}

	if reason == "" {
		reason = "declined"
	}

	// Update DB
	if err := s.callRepo.EndCall(ctx, callID, reason); err != nil {
		return fmt.Errorf("rejecting call: %w", err)
	}

	// Remove from active
	s.mu.Lock()
	if ac, ok := s.activeCalls[callID]; ok {
		ac.Timer.Stop()
		delete(s.activeCalls, callID)
	}
	s.mu.Unlock()

	// Notify caller
	payload, _ := json.Marshal(map[string]interface{}{
		"call_id": callID,
		"reason":  reason,
	})
	s.hub.SendToUser(call.CallerID, ws.WSMessage{
		Type:    "call_rejected",
		Payload: payload,
	})

	slog.Info("call rejected", "call_id", callID, "reason", reason)
	return nil
}

func (s *CallService) EndCall(ctx context.Context, callID, userID uuid.UUID) error {
	call, err := s.callRepo.GetByID(ctx, callID)
	if err != nil || call == nil {
		return fmt.Errorf("call not found")
	}
	if call.CallerID != userID && call.CalleeID != userID {
		return fmt.Errorf("not a call participant")
	}

	// Update DB
	if err := s.callRepo.EndCall(ctx, callID, "hangup"); err != nil {
		return fmt.Errorf("ending call: %w", err)
	}

	// Remove from active
	s.mu.Lock()
	if ac, ok := s.activeCalls[callID]; ok {
		ac.Timer.Stop()
		delete(s.activeCalls, callID)
	}
	s.mu.Unlock()

	// Notify the other party
	otherID := call.CalleeID
	if userID == call.CalleeID {
		otherID = call.CallerID
	}

	payload, _ := json.Marshal(map[string]interface{}{
		"call_id": callID,
		"reason":  "hangup",
	})
	s.hub.SendToUser(otherID, ws.WSMessage{
		Type:    "call_ended",
		Payload: payload,
	})

	slog.Info("call ended", "call_id", callID)
	return nil
}

// RelaySignaling forwards WebRTC signaling messages (offer/answer/ice) to the other participant.
func (s *CallService) RelaySignaling(senderID uuid.UUID, callID uuid.UUID, msgType string, payload json.RawMessage) {
	s.mu.RLock()
	ac, ok := s.activeCalls[callID]
	s.mu.RUnlock()

	if !ok {
		slog.Debug("relay: call not active", "call_id", callID)
		return
	}

	// Determine recipient
	var recipientID uuid.UUID
	if senderID == ac.CallerID {
		recipientID = ac.CalleeID
	} else if senderID == ac.CalleeID {
		recipientID = ac.CallerID
	} else {
		slog.Warn("relay: sender not a participant", "call_id", callID, "sender", senderID)
		return
	}

	s.hub.SendToUser(recipientID, ws.WSMessage{
		Type:    msgType,
		Payload: payload,
	})
}

// RelayCoBrowse forwards co-browse events to the other participant.
func (s *CallService) RelayCoBrowse(senderID uuid.UUID, callID uuid.UUID, msgType string, payload json.RawMessage) {
	s.RelaySignaling(senderID, callID, msgType, payload)
}

func (s *CallService) GetCallHistory(ctx context.Context, userID uuid.UUID, limit, offset int) ([]model.Call, error) {
	return s.callRepo.GetCallHistory(ctx, userID, limit, offset)
}

func (s *CallService) GetConversationCalls(ctx context.Context, convID uuid.UUID, limit, offset int) ([]model.Call, error) {
	return s.callRepo.GetConversationCalls(ctx, convID, limit, offset)
}

func (s *CallService) handleRingTimeout(callID uuid.UUID) {
	ctx := context.Background()

	call, err := s.callRepo.GetByID(ctx, callID)
	if err != nil || call == nil {
		return
	}

	// Only timeout if still ringing
	if call.Status != "ringing" {
		return
	}

	s.callRepo.EndCall(ctx, callID, "timeout")

	s.mu.Lock()
	delete(s.activeCalls, callID)
	s.mu.Unlock()

	// Notify both parties
	payload, _ := json.Marshal(map[string]interface{}{
		"call_id": callID,
		"reason":  "timeout",
	})
	msg := ws.WSMessage{
		Type:    "call_ended",
		Payload: payload,
	}
	s.hub.SendToUser(call.CallerID, msg)
	s.hub.SendToUser(call.CalleeID, msg)

	slog.Info("call timed out", "call_id", callID)
}
