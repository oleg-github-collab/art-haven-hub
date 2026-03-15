package service

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/art-haven-hub/backend/internal/model"
	"github.com/art-haven-hub/backend/internal/pkg/apperror"
	"github.com/art-haven-hub/backend/internal/repository"
	"github.com/art-haven-hub/backend/internal/ws"
	"github.com/google/uuid"
)

type MessengerService struct {
	messengerRepo *repository.MessengerRepo
	hub           *ws.Hub
}

func NewMessengerService(messengerRepo *repository.MessengerRepo, hub *ws.Hub) *MessengerService {
	return &MessengerService{messengerRepo: messengerRepo, hub: hub}
}

type CreateConversationInput struct {
	Type      string      `json:"type" validate:"required,oneof=private group channel"`
	Name      *string     `json:"name" validate:"omitempty,max=100"`
	MemberIDs []uuid.UUID `json:"member_ids" validate:"required,min=1,max=50"`
}

type SendMessageInput struct {
	Content     string          `json:"content" validate:"required,min=1,max=5000"`
	MessageType string          `json:"message_type" validate:"omitempty,oneof=text image file gif"`
	Attachments json.RawMessage `json:"attachments"`
	ReplyToID   *uuid.UUID      `json:"reply_to_id"`
}

func (s *MessengerService) CreateConversation(ctx context.Context, creatorID uuid.UUID, input *CreateConversationInput) (*model.Conversation, error) {
	if input.Type == "private" && len(input.MemberIDs) == 1 {
		existing, _ := s.messengerRepo.GetPrivateConversation(ctx, creatorID, input.MemberIDs[0])
		if existing != nil {
			return existing, nil
		}
	}

	conv := &model.Conversation{
		Type:      input.Type,
		Name:      input.Name,
		CreatorID: &creatorID,
	}

	if err := s.messengerRepo.CreateConversation(ctx, conv); err != nil {
		return nil, fmt.Errorf("creating conversation: %w", err)
	}

	if err := s.messengerRepo.AddMember(ctx, conv.ID, creatorID, "admin"); err != nil {
		return nil, fmt.Errorf("adding creator: %w", err)
	}

	for _, memberID := range input.MemberIDs {
		if memberID != creatorID {
			s.messengerRepo.AddMember(ctx, conv.ID, memberID, "member")
		}
	}

	return conv, nil
}

func (s *MessengerService) GetConversations(ctx context.Context, userID uuid.UUID) ([]model.Conversation, error) {
	convs, err := s.messengerRepo.GetUserConversations(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("getting conversations: %w", err)
	}

	for i := range convs {
		members, _ := s.messengerRepo.GetMembers(ctx, convs[i].ID)
		for j := range members {
			user, _ := s.messengerRepo.GetUserByID(ctx, members[j].UserID)
			members[j].User = user
		}
		convs[i].Members = members
	}

	return convs, nil
}

func (s *MessengerService) GetConversation(ctx context.Context, convID, userID uuid.UUID) (*model.Conversation, error) {
	isMember, _ := s.messengerRepo.IsMember(ctx, convID, userID)
	if !isMember {
		return nil, apperror.Forbidden("not a member of this conversation")
	}

	conv, err := s.messengerRepo.GetConversation(ctx, convID)
	if err != nil {
		return nil, fmt.Errorf("getting conversation: %w", err)
	}
	if conv == nil {
		return nil, apperror.NotFound("conversation", convID.String())
	}

	members, _ := s.messengerRepo.GetMembers(ctx, convID)
	for i := range members {
		user, _ := s.messengerRepo.GetUserByID(ctx, members[i].UserID)
		members[i].User = user
	}
	conv.Members = members

	return conv, nil
}

func (s *MessengerService) SendMessage(ctx context.Context, convID, senderID uuid.UUID, input *SendMessageInput) (*model.Message, error) {
	isMember, _ := s.messengerRepo.IsMember(ctx, convID, senderID)
	if !isMember {
		return nil, apperror.Forbidden("not a member of this conversation")
	}

	msgType := input.MessageType
	if msgType == "" {
		msgType = "text"
	}
	attachments := input.Attachments
	if attachments == nil {
		attachments = json.RawMessage("[]")
	}

	msg := &model.Message{
		ConversationID: convID,
		SenderID:       senderID,
		Content:        input.Content,
		MessageType:    msgType,
		Attachments:    attachments,
		ReplyToID:      input.ReplyToID,
	}

	if err := s.messengerRepo.CreateMessage(ctx, msg); err != nil {
		return nil, fmt.Errorf("creating message: %w", err)
	}

	sender, _ := s.messengerRepo.GetUserByID(ctx, senderID)
	msg.Sender = sender

	// Enrich reply if present
	if input.ReplyToID != nil {
		replyMsg, _ := s.messengerRepo.GetMessage(ctx, *input.ReplyToID)
		if replyMsg != nil {
			replySender, _ := s.messengerRepo.GetUserByID(ctx, replyMsg.SenderID)
			replyMsg.Sender = replySender
			msg.ReplyTo = replyMsg
		}
	}

	payload, _ := json.Marshal(msg)
	s.hub.BroadcastToRoom(convID, ws.WSMessage{
		Type:    "message.new",
		Payload: payload,
	}, nil)

	return msg, nil
}

func (s *MessengerService) GetMessages(ctx context.Context, convID, userID uuid.UUID, limit, offset int) ([]model.Message, error) {
	isMember, _ := s.messengerRepo.IsMember(ctx, convID, userID)
	if !isMember {
		return nil, apperror.Forbidden("not a member of this conversation")
	}

	msgs, err := s.messengerRepo.GetMessages(ctx, convID, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("getting messages: %w", err)
	}

	for i := range msgs {
		sender, _ := s.messengerRepo.GetUserByID(ctx, msgs[i].SenderID)
		msgs[i].Sender = sender

		reactions, _ := s.messengerRepo.GetReactions(ctx, msgs[i].ID)
		msgs[i].Reactions = reactions
	}

	return msgs, nil
}

func (s *MessengerService) MarkRead(ctx context.Context, convID, userID uuid.UUID) error {
	return s.messengerRepo.MarkRead(ctx, convID, userID)
}

func (s *MessengerService) UpdatePin(ctx context.Context, convID, userID uuid.UUID, pinned bool) error {
	return s.messengerRepo.UpdatePin(ctx, convID, userID, pinned)
}

func (s *MessengerService) UpdateMute(ctx context.Context, convID, userID uuid.UUID, muted bool) error {
	return s.messengerRepo.UpdateMute(ctx, convID, userID, muted)
}

// --- Reactions ---

func (s *MessengerService) ToggleReaction(ctx context.Context, messageID, userID uuid.UUID, emoji string) (bool, error) {
	has, err := s.messengerRepo.HasReaction(ctx, messageID, userID, emoji)
	if err != nil {
		return false, fmt.Errorf("checking reaction: %w", err)
	}

	if has {
		if err := s.messengerRepo.RemoveReaction(ctx, messageID, userID, emoji); err != nil {
			return false, fmt.Errorf("removing reaction: %w", err)
		}

		// Broadcast removal
		msg, _ := s.messengerRepo.GetMessage(ctx, messageID)
		if msg != nil {
			payload, _ := json.Marshal(map[string]interface{}{
				"message_id": messageID,
				"user_id":    userID,
				"emoji":      emoji,
				"action":     "removed",
			})
			s.hub.BroadcastToRoom(msg.ConversationID, ws.WSMessage{
				Type:    "reaction.update",
				Payload: payload,
			}, nil)
		}
		return false, nil
	}

	if err := s.messengerRepo.AddReaction(ctx, messageID, userID, emoji); err != nil {
		return false, fmt.Errorf("adding reaction: %w", err)
	}

	msg, _ := s.messengerRepo.GetMessage(ctx, messageID)
	if msg != nil {
		payload, _ := json.Marshal(map[string]interface{}{
			"message_id": messageID,
			"user_id":    userID,
			"emoji":      emoji,
			"action":     "added",
		})
		s.hub.BroadcastToRoom(msg.ConversationID, ws.WSMessage{
			Type:    "reaction.update",
			Payload: payload,
		}, nil)
	}

	return true, nil
}

// --- Forward ---

func (s *MessengerService) ForwardMessage(ctx context.Context, messageID, userID uuid.UUID, targetConvIDs []uuid.UUID) ([]*model.Message, error) {
	original, err := s.messengerRepo.GetMessage(ctx, messageID)
	if err != nil || original == nil {
		return nil, apperror.NotFound("message", messageID.String())
	}

	var forwarded []*model.Message
	for _, convID := range targetConvIDs {
		isMember, _ := s.messengerRepo.IsMember(ctx, convID, userID)
		if !isMember {
			continue
		}

		content := fmt.Sprintf("↪ Forwarded:\n%s", original.Content)
		fwdMsg := &model.Message{
			ConversationID: convID,
			SenderID:       userID,
			Content:        content,
			MessageType:    original.MessageType,
			Attachments:    original.Attachments,
			ForwardedFrom:  &messageID,
		}

		if err := s.messengerRepo.CreateMessage(ctx, fwdMsg); err != nil {
			continue
		}

		sender, _ := s.messengerRepo.GetUserByID(ctx, userID)
		fwdMsg.Sender = sender

		// Track forward
		s.messengerRepo.CreateForward(ctx, &model.MessageForward{
			OriginalMessageID: messageID,
			ForwardedToConv:   convID,
			ForwardedBy:       userID,
		})

		// Broadcast
		payload, _ := json.Marshal(fwdMsg)
		s.hub.BroadcastToRoom(convID, ws.WSMessage{
			Type:    "message.new",
			Payload: payload,
		}, nil)

		forwarded = append(forwarded, fwdMsg)
	}

	return forwarded, nil
}
