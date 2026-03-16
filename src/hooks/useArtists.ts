import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import type { User } from "@/contexts/AuthContext";

interface ArtistListResult {
  artists: User[];
  total: number;
}

export function useArtists(params: { search?: string; city?: string; tag?: string; limit?: number; offset?: number } = {}) {
  const { search, city, tag, limit = 20, offset = 0 } = params;

  const queryString = new URLSearchParams();
  if (search) queryString.set("search", search);
  if (city) queryString.set("city", city);
  if (tag) queryString.set("tag", tag);
  queryString.set("limit", String(limit));
  queryString.set("offset", String(offset));

  return useQuery({
    queryKey: ["artists", search, city, tag, limit, offset],
    queryFn: () => apiGet<ArtistListResult>(`/api/v1/artists?${queryString.toString()}`),
  });
}
