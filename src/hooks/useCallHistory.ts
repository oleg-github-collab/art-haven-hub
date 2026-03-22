import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";

export interface Call {
  id: string;
  conversation_id: string;
  caller_id: string;
  callee_id: string;
  call_type: "audio" | "video";
  status: string;
  started_at?: string;
  ended_at?: string;
  duration_secs: number;
  end_reason?: string;
  created_at: string;
}

export function useCallHistory() {
  return useQuery({
    queryKey: ["call-history"],
    queryFn: () => apiGet<Call[]>("/api/v1/calls/history"),
  });
}

export function useConversationCalls(conversationId: string) {
  return useQuery({
    queryKey: ["conversation-calls", conversationId],
    queryFn: () => apiGet<Call[]>(`/api/v1/conversations/${conversationId}/calls`),
    enabled: !!conversationId,
  });
}
