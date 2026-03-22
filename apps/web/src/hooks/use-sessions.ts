"use client";

// Controller returns: { sessions: SessionHttpResponse[] }
// GET /sessions -> { sessions: [{ id, createdAt, ipAddress, userAgent, isCurrent }] }
// DELETE /sessions/:id -> 204 (no body)

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface SessionHttpResponse {
  id: string;
  createdAt: string;
  ipAddress: string | null;
  userAgent: string | null;
  isCurrent: boolean;
}

interface GetSessionsResponse {
  sessions: SessionHttpResponse[];
}

export function useSessions() {
  return useQuery({
    queryKey: ["sessions"],
    queryFn: () => apiClient.get<GetSessionsResponse>("/sessions"),
  });
}

export function useRevokeSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) =>
      apiClient.delete<void>(`/sessions/${sessionId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
  });
}
