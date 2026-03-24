import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiDelete } from "@/lib/api";

// ─── Types ───────────────────────────────────────────────────

export interface Connector {
  id: string;
  user_id: string;
  platform: string;
  status: "pending" | "active" | "expired" | "error";
  scopes?: string[];
  meta?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface WorkflowExecution {
  id: string;
  workflow_id: string;
  user_id: string;
  trigger_type: string;
  status: "queued" | "running" | "completed" | "failed" | "cancelled";
  started_at?: string;
  completed_at?: string;
  error?: string;
  created_at: string;
  node_logs?: ExecutionNodeLog[];
}

export interface ExecutionNodeLog {
  id: string;
  execution_id: string;
  node_id: string;
  node_type: string;
  status: "pending" | "running" | "success" | "failed" | "skipped";
  input_data?: Record<string, unknown>;
  output_data?: Record<string, unknown>;
  error?: string;
  started_at?: string;
  completed_at?: string;
  duration_ms: number;
}

export interface WebhookEndpoint {
  id: string;
  user_id: string;
  workflow_id: string;
  is_active: boolean;
  last_triggered?: string;
  created_at: string;
}

export interface PlatformInfo {
  id: string;
  name: string;
  category: string;
  auth_type: string;
}

export interface AIWorkflowResult {
  nodes: unknown[];
  connections: unknown[];
  explanation: string;
}

// ─── Connectors ──────────────────────────────────────────────

export function useConnectors() {
  return useQuery({
    queryKey: ["artflow-connectors"],
    queryFn: () => apiGet<Connector[]>("/api/v1/artflow/connectors"),
  });
}

export function useAddConnector() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { platform: string; credentials: Record<string, string> }) =>
      apiPost<Connector>("/api/v1/artflow/connectors", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["artflow-connectors"] }),
  });
}

export function useRemoveConnector() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (platform: string) =>
      apiDelete(`/api/v1/artflow/connectors/${platform}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["artflow-connectors"] }),
  });
}

export function useTestConnector() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (platform: string) =>
      apiPost<{ status: string }>(`/api/v1/artflow/connectors/${platform}/test`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["artflow-connectors"] }),
  });
}

// ─── OAuth ───────────────────────────────────────────────────

export function useOAuthURL(platform: string) {
  return useQuery({
    queryKey: ["artflow-oauth-url", platform],
    queryFn: () => apiGet<{ url: string }>(`/api/v1/artflow/oauth/${platform}/url`),
    enabled: false,
  });
}

export function useOAuthCallback() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ platform, code, state }: { platform: string; code: string; state?: string }) =>
      apiPost<Connector>(`/api/v1/artflow/oauth/${platform}/callback`, { code, state }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["artflow-connectors"] }),
  });
}

// ─── Workflow Execution ──────────────────────────────────────

export function useExecuteWorkflow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (workflowId: string) =>
      apiPost<WorkflowExecution>(`/api/v1/artflow/workflows/${workflowId}/execute`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["artflow-executions"] });
      qc.invalidateQueries({ queryKey: ["workflows"] });
    },
  });
}

export function useTestWorkflow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (workflowId: string) =>
      apiPost<WorkflowExecution>(`/api/v1/artflow/workflows/${workflowId}/test`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["artflow-executions"] }),
  });
}

export function useExecutions(limit?: number) {
  const params = limit ? `?limit=${limit}` : "";
  return useQuery({
    queryKey: ["artflow-executions", limit],
    queryFn: () => apiGet<WorkflowExecution[]>(`/api/v1/artflow/executions${params}`),
  });
}

export function useExecution(id: string) {
  return useQuery({
    queryKey: ["artflow-execution", id],
    queryFn: () => apiGet<WorkflowExecution>(`/api/v1/artflow/executions/${id}`),
    enabled: !!id,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data && (data.status === "queued" || data.status === "running")) {
        return 2000;
      }
      return false;
    },
  });
}

export function useCancelExecution() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiPost(`/api/v1/artflow/executions/${id}/cancel`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["artflow-executions"] }),
  });
}

// ─── Webhooks ────────────────────────────────────────────────

export function useWebhooks() {
  return useQuery({
    queryKey: ["artflow-webhooks"],
    queryFn: () => apiGet<WebhookEndpoint[]>("/api/v1/artflow/webhooks"),
  });
}

export function useCreateWebhook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (workflowId: string) =>
      apiPost<WebhookEndpoint>("/api/v1/artflow/webhooks", { workflow_id: workflowId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["artflow-webhooks"] }),
  });
}

export function useDeleteWebhook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/api/v1/artflow/webhooks/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["artflow-webhooks"] }),
  });
}

// ─── AI Assistant ────────────────────────────────────────────

export function useAIGenerateWorkflow() {
  return useMutation({
    mutationFn: (prompt: string) =>
      apiPost<AIWorkflowResult>("/api/v1/artflow/ai/generate-workflow", { prompt }),
  });
}

export function useAISuggestConfig() {
  return useMutation({
    mutationFn: (data: { node_type: string; context?: Record<string, unknown> }) =>
      apiPost<Record<string, unknown>>("/api/v1/artflow/ai/suggest-config", data),
  });
}

export function useAIExplain() {
  return useMutation({
    mutationFn: (data: { nodes: unknown[]; connections: unknown[] }) =>
      apiPost<{ explanation: string }>("/api/v1/artflow/ai/explain", data),
  });
}

// ─── Platforms ───────────────────────────────────────────────

export function usePlatforms() {
  return useQuery({
    queryKey: ["artflow-platforms"],
    queryFn: () => apiGet<PlatformInfo[]>("/api/v1/artflow/platforms"),
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}
