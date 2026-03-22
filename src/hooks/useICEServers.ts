import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";

export interface ICEServer {
  urls: string[];
  username?: string;
  credential?: string;
}

export function useICEServers() {
  return useQuery({
    queryKey: ["ice-servers"],
    queryFn: () => apiGet<ICEServer[]>("/api/v1/calls/ice-servers"),
    staleTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
