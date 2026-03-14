import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";

export interface Artwork {
  id: string;
  artist_id: string;
  title: string;
  description?: string;
  full_description?: string;
  category_id?: string;
  medium?: string;
  style?: string;
  width_cm?: number;
  height_cm?: number;
  depth_cm?: number;
  year_created?: number;
  condition: string;
  status: string;
  price_cents: number;
  currency: string;
  country?: string;
  city?: string;
  cover_image?: string;
  images: string[];
  tags: string[];
  is_original: boolean;
  is_framed: boolean;
  is_signed: boolean;
  shipping_type: string;
  shipping_price_cents: number;
  is_auction: boolean;
  auction_end_at?: string;
  current_bid_cents: number;
  bid_count: number;
  view_count: number;
  like_count: number;
  is_promoted: boolean;
  promoted_until?: string;
  created_at: string;
  updated_at: string;
  artist?: {
    id: string;
    display_name: string;
    handle: string;
    avatar_url?: string;
  };
  category?: { id: string; name: string; slug: string };
  is_favorited?: boolean;
}

export interface ArtworkFilters {
  category?: string;
  search?: string;
  min_price?: number;
  max_price?: number;
  condition?: string;
  country?: string;
  sort?: string;
  limit?: number;
  offset?: number;
  artist_id?: string;
}

function buildQuery(filters: ArtworkFilters): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, val]) => {
    if (val !== undefined && val !== "") params.set(key, String(val));
  });
  return params.toString();
}

export function useArtworks(filters: ArtworkFilters = {}) {
  return useQuery({
    queryKey: ["artworks", filters],
    queryFn: () => apiGet<Artwork[]>(`/api/v1/artworks?${buildQuery(filters)}`),
  });
}

export function useInfiniteArtworks(filters: ArtworkFilters = {}) {
  return useInfiniteQuery({
    queryKey: ["artworks-infinite", filters],
    queryFn: ({ pageParam = 0 }) =>
      apiGet<Artwork[]>(`/api/v1/artworks?${buildQuery({ ...filters, offset: pageParam, limit: filters.limit || 24 })}`),
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < (filters.limit || 24)) return undefined;
      return allPages.flat().length;
    },
    initialPageParam: 0,
  });
}

export function useArtwork(id: string) {
  return useQuery({
    queryKey: ["artwork", id],
    queryFn: () => apiGet<Artwork>(`/api/v1/artworks/${id}`),
    enabled: !!id,
  });
}

export function useCreateArtwork() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Artwork>) => apiPost<Artwork>("/api/v1/artworks", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["artworks"] }),
  });
}

export function useUpdateArtwork() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Artwork> & { id: string }) =>
      apiPut<Artwork>(`/api/v1/artworks/${id}`, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["artworks"] });
      qc.invalidateQueries({ queryKey: ["artwork", vars.id] });
    },
  });
}

export function useDeleteArtwork() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/api/v1/artworks/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["artworks"] }),
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: () => apiGet<{ id: string; name: string; slug: string }[]>("/api/v1/categories"),
    staleTime: 1000 * 60 * 60, // 1h
  });
}

export function useToggleFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isFavorited }: { id: string; isFavorited: boolean }) =>
      isFavorited ? apiDelete(`/api/v1/artworks/${id}/favorite`) : apiPost(`/api/v1/artworks/${id}/favorite`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["artworks"] });
      qc.invalidateQueries({ queryKey: ["favorites"] });
    },
  });
}

export function useFavorites() {
  return useQuery({
    queryKey: ["favorites"],
    queryFn: () => apiGet<Artwork[]>("/api/v1/artworks/favorites"),
  });
}

export function useSimilarArtworks(id: string) {
  return useQuery({
    queryKey: ["similar-artworks", id],
    queryFn: () => apiGet<Artwork[]>(`/api/v1/artworks/${id}/similar`),
    enabled: !!id,
  });
}

export function useSearch(query: string) {
  return useQuery({
    queryKey: ["search", query],
    queryFn: () => apiGet<{ id: string; type: string; title: string; image?: string; similarity: number }[]>(
      `/api/v1/search?q=${encodeURIComponent(query)}`
    ),
    enabled: query.length > 1,
  });
}

export function useRecommendations() {
  return useQuery({
    queryKey: ["recommendations"],
    queryFn: () => apiGet<Artwork[]>("/api/v1/recommendations"),
  });
}
