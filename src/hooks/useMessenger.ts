import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPut } from "@/lib/api";

export interface Conversation {
  id: string;
  type: string;
  name?: string;
  avatar_url?: string;
  last_message?: string;
  last_message_at?: string;
  unread_count: number;
  is_pinned: boolean;
  is_muted: boolean;
  created_at: string;
  members?: ConversationMember[];
}

export interface ConversationMember {
  user_id: string;
  display_name: string;
  handle: string;
  avatar_url?: string;
  role: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: string;
  attachment_url?: string;
  is_read: boolean;
  created_at: string;
  sender?: {
    id: string;
    display_name: string;
    handle: string;
    avatar_url?: string;
  };
}

export function useConversations() {
  return useQuery({
    queryKey: ["conversations"],
    queryFn: () => apiGet<Conversation[]>("/api/v1/conversations"),
  });
}

export function useConversation(id: string) {
  return useQuery({
    queryKey: ["conversation", id],
    queryFn: () => apiGet<Conversation>(`/api/v1/conversations/${id}`),
    enabled: !!id,
  });
}

export function useMessages(conversationId: string) {
  return useQuery({
    queryKey: ["messages", conversationId],
    queryFn: () => apiGet<Message[]>(`/api/v1/conversations/${conversationId}/messages`),
    enabled: !!conversationId,
    refetchInterval: 5000, // poll every 5s as fallback
  });
}

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ conversationId, content, messageType }: {
      conversationId: string;
      content: string;
      messageType?: string;
    }) =>
      apiPost<Message>(`/api/v1/conversations/${conversationId}/messages`, {
        content,
        message_type: messageType || "text",
      }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["messages", vars.conversationId] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

export function useCreateConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { type: string; member_ids: string[]; name?: string }) =>
      apiPost<Conversation>("/api/v1/conversations", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["conversations"] }),
  });
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (conversationId: string) =>
      apiPut(`/api/v1/conversations/${conversationId}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["conversations"] }),
  });
}

export function usePinConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isPinned }: { id: string; isPinned: boolean }) =>
      apiPut(`/api/v1/conversations/${id}/pin`, { is_pinned: !isPinned }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["conversations"] }),
  });
}

export function useMuteConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isMuted }: { id: string; isMuted: boolean }) =>
      apiPut(`/api/v1/conversations/${id}/mute`, { is_muted: !isMuted }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["conversations"] }),
  });
}
