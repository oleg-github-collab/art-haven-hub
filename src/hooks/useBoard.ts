import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";

export interface Announcement {
  id: string;
  author_id: string;
  type: string; // offer | seek
  title: string;
  description: string;
  category?: string;
  location?: string;
  budget?: string;
  images: string[];
  tags: string[];
  is_active: boolean;
  expires_at?: string;
  created_at: string;
  author?: {
    id: string;
    display_name: string;
    handle: string;
    avatar_url?: string;
  };
}

export interface EventItem {
  id: string;
  organizer_id: string;
  title: string;
  description: string;
  event_type: string;
  location?: string;
  address?: string;
  city?: string;
  country?: string;
  is_online: boolean;
  online_url?: string;
  cover_image?: string;
  images: string[];
  starts_at: string;
  ends_at?: string;
  price_cents: number;
  currency: string;
  max_attendees?: number;
  attendee_count: number;
  tags: string[];
  is_featured: boolean;
  created_at: string;
  is_attending?: boolean;
  organizer?: {
    id: string;
    display_name: string;
    handle: string;
    avatar_url?: string;
  };
}

export interface BlogPost {
  id: string;
  author_id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  cover_image?: string;
  tags: string[];
  is_published: boolean;
  published_at?: string;
  view_count: number;
  created_at: string;
  author?: {
    id: string;
    display_name: string;
    handle: string;
    avatar_url?: string;
  };
}

// Board hooks
export function useAnnouncements(type?: string) {
  return useQuery({
    queryKey: ["announcements", type],
    queryFn: () => {
      const params = type ? `?type=${type}` : "";
      return apiGet<Announcement[]>(`/api/v1/board${params}`);
    },
  });
}

export function useCreateAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Announcement>) => apiPost<Announcement>("/api/v1/board", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["announcements"] }),
  });
}

export function useUpdateAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Announcement> & { id: string }) =>
      apiPut<Announcement>(`/api/v1/board/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["announcements"] }),
  });
}

export function useDeleteAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/api/v1/board/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["announcements"] }),
  });
}

export function useBoardMatches(id: string) {
  return useQuery({
    queryKey: ["board-matches", id],
    queryFn: () => apiGet<Announcement[]>(`/api/v1/board/${id}/matches`),
    enabled: !!id,
  });
}

// Events hooks
export function useEvents() {
  return useQuery({
    queryKey: ["events"],
    queryFn: () => apiGet<EventItem[]>("/api/v1/events"),
  });
}

export function useEvent(id: string) {
  return useQuery({
    queryKey: ["event", id],
    queryFn: () => apiGet<EventItem>(`/api/v1/events/${id}`),
    enabled: !!id,
  });
}

export function useCreateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<EventItem>) => apiPost<EventItem>("/api/v1/events", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["events"] }),
  });
}

export function useDeleteEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/api/v1/events/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["events"] }),
  });
}

export function useAttendEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isAttending }: { id: string; isAttending: boolean }) =>
      isAttending ? apiDelete(`/api/v1/events/${id}/attend`) : apiPost(`/api/v1/events/${id}/attend`),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["events"] });
      qc.invalidateQueries({ queryKey: ["event", vars.id] });
    },
  });
}

// Blog hooks
export function useBlogPosts() {
  return useQuery({
    queryKey: ["blog-posts"],
    queryFn: () => apiGet<BlogPost[]>("/api/v1/blog"),
  });
}

export function useBlogPost(slug: string) {
  return useQuery({
    queryKey: ["blog-post", slug],
    queryFn: () => apiGet<BlogPost>(`/api/v1/blog/${slug}`),
    enabled: !!slug,
  });
}

export function useCreateBlogPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<BlogPost>) => apiPost<BlogPost>("/api/v1/blog", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["blog-posts"] }),
  });
}
