import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface UploadResult {
  id: string;
  url: string;
  filename: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
}

export function useUpload() {
  return useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return api<UploadResult>("/api/v1/uploads", {
        method: "POST",
        body: formData,
      });
    },
  });
}

export function useMultiUpload() {
  return useMutation({
    mutationFn: async (files: File[]) => {
      const results: UploadResult[] = [];
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        const result = await api<UploadResult>("/api/v1/uploads", {
          method: "POST",
          body: formData,
        });
        results.push(result);
      }
      return results;
    },
  });
}
