import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";

export interface FeedPost {
  id: string;
  author_id: string;
  content: string;
  images: string[];
  tags: string[];
  like_count: number;
  comment_count: number;
  repost_count: number;
  is_liked?: boolean;
  is_reposted?: boolean;
  is_bookmarked?: boolean;
  created_at: string;
  updated_at: string;
  author?: {
    id: string;
    display_name: string;
    handle: string;
    avatar_url?: string;
  };
}

export interface FeedComment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  like_count: number;
  created_at: string;
  author?: {
    id: string;
    display_name: string;
    handle: string;
    avatar_url?: string;
  };
}

export function useFeed(sort: string = "recent") {
  return useInfiniteQuery({
    queryKey: ["feed", sort],
    queryFn: ({ pageParam = 0 }) =>
      apiGet<FeedPost[]>(`/api/v1/feed?sort=${sort}&limit=20&offset=${pageParam}`),
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < 20) return undefined;
      return allPages.flat().length;
    },
    initialPageParam: 0,
  });
}

export function useFeedPost(id: string) {
  return useQuery({
    queryKey: ["feed-post", id],
    queryFn: () => apiGet<FeedPost>(`/api/v1/feed/${id}`),
    enabled: !!id,
  });
}

export function useCreatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { content: string; images?: string[]; tags?: string[] }) =>
      apiPost<FeedPost>("/api/v1/feed", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["feed"] }),
  });
}

export function useUpdatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; content: string; images?: string[]; tags?: string[] }) =>
      apiPut<FeedPost>(`/api/v1/feed/${id}`, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["feed"] });
      qc.invalidateQueries({ queryKey: ["feed-post", vars.id] });
    },
  });
}

export function useDeletePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/api/v1/feed/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["feed"] }),
  });
}

export function useLikePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isLiked }: { id: string; isLiked: boolean }) =>
      isLiked ? apiDelete(`/api/v1/feed/${id}/like`) : apiPost(`/api/v1/feed/${id}/like`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["feed"] }),
  });
}

export function useRepostPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isReposted }: { id: string; isReposted: boolean }) =>
      isReposted ? apiDelete(`/api/v1/feed/${id}/repost`) : apiPost(`/api/v1/feed/${id}/repost`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["feed"] }),
  });
}

export function useBookmarkPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isBookmarked }: { id: string; isBookmarked: boolean }) =>
      isBookmarked ? apiDelete(`/api/v1/feed/${id}/bookmark`) : apiPost(`/api/v1/feed/${id}/bookmark`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["feed"] });
      qc.invalidateQueries({ queryKey: ["bookmarks"] });
    },
  });
}

export function useBookmarks() {
  return useQuery({
    queryKey: ["bookmarks"],
    queryFn: () => apiGet<FeedPost[]>("/api/v1/feed/bookmarks"),
  });
}

export function useComments(postId: string) {
  return useQuery({
    queryKey: ["comments", postId],
    queryFn: () => apiGet<FeedComment[]>(`/api/v1/feed/${postId}/comments`),
    enabled: !!postId,
  });
}

export function useCreateComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, content }: { postId: string; content: string }) =>
      apiPost<FeedComment>(`/api/v1/feed/${postId}/comments`, { content }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["comments", vars.postId] });
      qc.invalidateQueries({ queryKey: ["feed"] });
    },
  });
}

export function useDeleteComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (commentId: string) => apiDelete(`/api/v1/feed/comments/${commentId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["comments"] });
      qc.invalidateQueries({ queryKey: ["feed"] });
    },
  });
}
