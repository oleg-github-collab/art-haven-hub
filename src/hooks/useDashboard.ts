import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";

export interface DashboardStats {
  total: number;
  active: number;
  sold: number;
  views: number;
  likes: number;
  revenue: number;
}

export interface DashboardArtwork {
  id: string;
  title: string;
  price: number;
  status: string;
  views: number;
  likes: number;
  created_at: string;
  cover_image?: string;
  is_promoted: boolean;
  promoted_until?: string;
}

export interface DataPoint {
  label: string;
  value: number;
}

export interface AnalyticsData {
  period: string;
  views: DataPoint[];
  sales: DataPoint[];
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => apiGet<DashboardStats>("/api/v1/dashboard/stats"),
  });
}

export function useDashboardArtworks(status?: string) {
  return useQuery({
    queryKey: ["dashboard-artworks", status],
    queryFn: () => {
      const params = status ? `?status=${status}` : "";
      return apiGet<DashboardArtwork[]>(`/api/v1/dashboard/artworks${params}`);
    },
  });
}

export function useDashboardAnalytics(period: string = "month") {
  return useQuery({
    queryKey: ["dashboard-analytics", period],
    queryFn: () => apiGet<AnalyticsData>(`/api/v1/dashboard/analytics?period=${period}`),
  });
}

export function useDashboardOrders() {
  return useQuery({
    queryKey: ["dashboard-orders"],
    queryFn: () =>
      apiGet<{
        id: string;
        buyer_id: string;
        status: string;
        total_cents: number;
        currency: string;
        created_at: string;
        item_count: number;
      }[]>("/api/v1/dashboard/orders"),
  });
}
