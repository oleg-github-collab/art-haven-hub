import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";
import type { User } from "@/contexts/AuthContext";

export function useProfile(handle: string) {
  return useQuery({
    queryKey: ["profile", handle],
    queryFn: () => apiGet<User>(`/api/v1/users/${handle}`),
    enabled: !!handle,
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<User>) => apiPut<User>("/api/v1/users/me", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}

export function useUploadAvatar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append("avatar", file);
      return apiPut<User>("/api/v1/users/me/avatar", formData);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile"] }),
  });
}

export function useFollow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, isFollowing }: { userId: string; isFollowing: boolean }) =>
      isFollowing
        ? apiDelete(`/api/v1/users/${userId}/follow`)
        : apiPost(`/api/v1/users/${userId}/follow`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile"] }),
  });
}

export function useFollowers(userId: string) {
  return useQuery({
    queryKey: ["followers", userId],
    queryFn: () => apiGet<User[]>(`/api/v1/users/${userId}/followers`),
    enabled: !!userId,
  });
}

export function useFollowing(userId: string) {
  return useQuery({
    queryKey: ["following", userId],
    queryFn: () => apiGet<User[]>(`/api/v1/users/${userId}/following`),
    enabled: !!userId,
  });
}
