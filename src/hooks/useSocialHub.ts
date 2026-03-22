import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";

// ─── Types ───────────────────────────────────────────────────

export interface SocialAccount {
  id: string;
  user_id: string;
  platform: string;
  handle: string;
  connected: boolean;
  followers: number;
  auto_post: boolean;
  created_at: string;
  updated_at: string;
}

export interface ScheduledPost {
  id: string;
  user_id: string;
  title: string;
  platform: string;
  caption: string;
  date: string;
  time: string;
  status: "draft" | "scheduled" | "published" | "failed" | "processing" | "paused";
  retries: number;
  artwork_id?: string;
  campaign_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Campaign {
  id: string;
  user_id: string;
  name: string;
  platforms: string[];
  status: "draft" | "scheduled" | "active" | "completed";
  scheduled_at?: string;
  reach: number;
  engagement: number;
  created_at: string;
  updated_at: string;
}

export interface Workflow {
  id: string;
  user_id: string;
  name: string;
  description: string;
  icon: string;
  nodes: unknown[];
  connections: unknown[];
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface SocialHubStats {
  connected_accounts: number;
  active_campaigns: number;
  total_reach: number;
  total_engagement: number;
  scheduled_posts: number;
}

// ─── Accounts ────────────────────────────────────────────────

export function useSocialAccounts() {
  return useQuery({
    queryKey: ["social-accounts"],
    queryFn: () => apiGet<SocialAccount[]>("/api/v1/social/accounts"),
  });
}

export function useConnectAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { platform: string; handle: string }) =>
      apiPost<SocialAccount>("/api/v1/social/accounts", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["social-accounts"] });
      qc.invalidateQueries({ queryKey: ["social-stats"] });
    },
  });
}

export function useDisconnectAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (platform: string) =>
      apiDelete(`/api/v1/social/accounts/${platform}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["social-accounts"] });
      qc.invalidateQueries({ queryKey: ["social-stats"] });
    },
  });
}

export function useUpdateAutoPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { platform: string; auto_post: boolean }) =>
      apiPut("/api/v1/social/accounts/auto-post", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["social-accounts"] }),
  });
}

// ─── Scheduled Posts ─────────────────────────────────────────

export function useScheduledPosts(params?: {
  date_from?: string;
  date_to?: string;
  status?: string;
  platform?: string;
}) {
  const search = new URLSearchParams();
  if (params?.date_from) search.set("date_from", params.date_from);
  if (params?.date_to) search.set("date_to", params.date_to);
  if (params?.status) search.set("status", params.status);
  if (params?.platform) search.set("platform", params.platform);
  const qs = search.toString();

  return useQuery({
    queryKey: ["scheduled-posts", params],
    queryFn: () => apiGet<ScheduledPost[]>(`/api/v1/social/posts${qs ? `?${qs}` : ""}`),
  });
}

export function useCreateScheduledPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      title: string;
      platform: string;
      caption?: string;
      date: string;
      time: string;
      artwork_id?: string;
      campaign_id?: string;
    }) => apiPost<ScheduledPost>("/api/v1/social/posts", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["scheduled-posts"] });
      qc.invalidateQueries({ queryKey: ["post-queue"] });
      qc.invalidateQueries({ queryKey: ["social-stats"] });
    },
  });
}

export function useUpdateScheduledPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; title?: string; platform?: string; caption?: string; date?: string; time?: string; status?: string }) =>
      apiPut<ScheduledPost>(`/api/v1/social/posts/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["scheduled-posts"] });
      qc.invalidateQueries({ queryKey: ["post-queue"] });
    },
  });
}

export function useDeleteScheduledPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/api/v1/social/posts/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["scheduled-posts"] });
      qc.invalidateQueries({ queryKey: ["post-queue"] });
      qc.invalidateQueries({ queryKey: ["social-stats"] });
    },
  });
}

export function useDuplicateScheduledPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiPost<ScheduledPost>(`/api/v1/social/posts/${id}/duplicate`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["scheduled-posts"] });
      qc.invalidateQueries({ queryKey: ["post-queue"] });
    },
  });
}

export function useRetryScheduledPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiPost<ScheduledPost>(`/api/v1/social/posts/${id}/retry`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["post-queue"] }),
  });
}

// ─── Post Queue ──────────────────────────────────────────────

export function usePostQueue() {
  return useQuery({
    queryKey: ["post-queue"],
    queryFn: () => apiGet<ScheduledPost[]>("/api/v1/social/queue"),
  });
}

export function useClearCompletedPosts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiDelete<{ deleted: number }>("/api/v1/social/queue/completed"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["post-queue"] });
      qc.invalidateQueries({ queryKey: ["scheduled-posts"] });
    },
  });
}

// ─── Campaigns ───────────────────────────────────────────────

export function useCampaigns() {
  return useQuery({
    queryKey: ["campaigns"],
    queryFn: () => apiGet<Campaign[]>("/api/v1/social/campaigns"),
  });
}

export function useCreateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; platforms: string[]; status?: string }) =>
      apiPost<Campaign>("/api/v1/social/campaigns", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["campaigns"] });
      qc.invalidateQueries({ queryKey: ["social-stats"] });
    },
  });
}

export function useUpdateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; name?: string; platforms?: string[]; status?: string }) =>
      apiPut<Campaign>(`/api/v1/social/campaigns/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["campaigns"] });
      qc.invalidateQueries({ queryKey: ["social-stats"] });
    },
  });
}

export function useDeleteCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/api/v1/social/campaigns/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["campaigns"] });
      qc.invalidateQueries({ queryKey: ["social-stats"] });
    },
  });
}

// ─── Workflows ───────────────────────────────────────────────

export function useWorkflows() {
  return useQuery({
    queryKey: ["workflows"],
    queryFn: () => apiGet<Workflow[]>("/api/v1/social/workflows"),
  });
}

export function usePublicWorkflows() {
  return useQuery({
    queryKey: ["workflows-public"],
    queryFn: () => apiGet<Workflow[]>("/api/v1/social/workflows/public"),
  });
}

export function useWorkflow(id: string) {
  return useQuery({
    queryKey: ["workflow", id],
    queryFn: () => apiGet<Workflow>(`/api/v1/social/workflows/${id}`),
    enabled: !!id,
  });
}

export function useCreateWorkflow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      name: string;
      description?: string;
      icon?: string;
      nodes: unknown[];
      connections?: unknown[];
      is_public?: boolean;
    }) => apiPost<Workflow>("/api/v1/social/workflows", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workflows"] }),
  });
}

export function useUpdateWorkflow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: {
      id: string;
      name?: string;
      description?: string;
      icon?: string;
      nodes?: unknown[];
      connections?: unknown[];
      is_public?: boolean;
    }) => apiPut<Workflow>(`/api/v1/social/workflows/${id}`, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["workflows"] });
      qc.invalidateQueries({ queryKey: ["workflow", vars.id] });
    },
  });
}

export function useDeleteWorkflow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/api/v1/social/workflows/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workflows"] }),
  });
}

// ─── Stats ───────────────────────────────────────────────────

export function useSocialHubStats() {
  return useQuery({
    queryKey: ["social-stats"],
    queryFn: () => apiGet<SocialHubStats>("/api/v1/social/stats"),
  });
}
