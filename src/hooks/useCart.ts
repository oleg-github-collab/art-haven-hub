import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";
import { getAccessToken } from "@/lib/api";

export interface CartItem {
  id: string;
  artwork_id: string;
  quantity: number;
  created_at: string;
  artwork?: {
    id: string;
    title: string;
    cover_image?: string;
    price_cents: number;
    currency: string;
    artist?: { display_name: string };
  };
}

export function useServerCart() {
  return useQuery({
    queryKey: ["cart"],
    queryFn: () => apiGet<CartItem[]>("/api/v1/cart"),
    enabled: !!getAccessToken(),
  });
}

export function useAddToCart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { artwork_id: string; quantity: number }) =>
      apiPost("/api/v1/cart/items", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cart"] }),
  });
}

export function useUpdateCartItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { artwork_id: string; quantity: number }) =>
      apiPut("/api/v1/cart/items", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cart"] }),
  });
}

export function useRemoveFromCart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (artworkId: string) =>
      apiDelete(`/api/v1/cart/items?artwork_id=${artworkId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cart"] }),
  });
}

export function useClearCart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiDelete("/api/v1/cart"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cart"] }),
  });
}

export function useSyncCart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (items: { artwork_id: string; quantity: number }[]) =>
      apiPost("/api/v1/cart/sync", { items }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cart"] }),
  });
}

export function useCheckout() {
  return useMutation({
    mutationFn: (data: {
      shipping_name: string;
      shipping_address: string;
      shipping_city: string;
      shipping_country: string;
      shipping_postal_code: string;
    }) => apiPost<{ session_id: string; checkout_url: string }>("/api/v1/checkout/session", data),
  });
}
