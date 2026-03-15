import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";

export interface Artwork {
  id: string;
  artist_id: string;
  title: string;
  description?: string;
  full_description?: string;
  category_id: string;
  subcategory?: string;
  condition?: string;
  status: string;
  price_cents: number;
  currency: string;
  country?: string;
  city?: string;
  images: string[];
  emoji?: string;
  width_cm?: number;
  height_cm?: number;
  tags: string[];
  view_count: number;
  like_count: number;
  is_biddable: boolean;
  current_bid_cents: number;
  bid_count: number;
  shipping_options: string[];
  return_policy?: string;
  is_promoted: boolean;
  promoted_until?: string;
  is_featured: boolean;
  translations?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  artist?: {
    id: string;
    display_name: string;
    handle: string;
    avatar_url?: string;
  };
  is_favorited?: boolean;
  avg_rating?: number;
  review_count?: number;
}

export interface ArtworkListResult {
  items: Artwork[];
  total: number;
  next_cursor?: string;
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
  status?: string;
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
    queryFn: () => apiGet<ArtworkListResult>(`/api/v1/artworks?${buildQuery(filters)}`),
  });
}

export function useInfiniteArtworks(filters: ArtworkFilters = {}) {
  return useInfiniteQuery({
    queryKey: ["artworks-infinite", filters],
    queryFn: ({ pageParam = "" }) => {
      const q = buildQuery({ ...filters, limit: filters.limit || 24 });
      const cursor = pageParam ? `&cursor=${pageParam}` : "";
      return apiGet<ArtworkListResult>(`/api/v1/artworks?${q}${cursor}`);
    },
    getNextPageParam: (lastPage) => lastPage.next_cursor || undefined,
    initialPageParam: "",
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

export interface Category {
  id: string;
  label: string;
  sort: number;
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: () => apiGet<Category[]>("/api/v1/categories"),
    staleTime: 1000 * 60 * 60,
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

// Helper to format price from cents
export function formatPrice(cents: number, currency = "EUR"): string {
  return new Intl.NumberFormat("uk-UA", { style: "currency", currency }).format(cents / 100);
}
