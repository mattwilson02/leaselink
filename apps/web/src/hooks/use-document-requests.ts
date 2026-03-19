"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface DocumentRequestDTO {
  id: string;
  clientId: string;
  requestedBy: string;
  requestType: string;
  status: string;
  documentId: string | null;
  createdAt: string;
  updatedAt: string | null;
}

interface DocumentRequestFilters {
  offset?: number;
  limit?: number;
  requestType?: string;
}

function buildQueryString(filters: DocumentRequestFilters): string {
  const params = new URLSearchParams();
  if (filters.offset !== undefined) params.set("offset", String(filters.offset));
  if (filters.limit !== undefined) params.set("limit", String(filters.limit));
  if (filters.requestType) params.set("requestType", filters.requestType);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function useDocumentRequests(params: DocumentRequestFilters = {}) {
  return useQuery({
    queryKey: ["document-requests", params],
    queryFn: () =>
      apiClient.get<{ documentRequests: DocumentRequestDTO[] }>(
        `/document-requests${buildQueryString(params)}`
      ),
  });
}

export function useDocumentRequest(id: string) {
  return useQuery({
    queryKey: ["document-requests", id],
    queryFn: () =>
      apiClient.get<DocumentRequestDTO>(`/document-requests/${id}`),
    enabled: !!id,
  });
}

export function useCreateDocumentRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { clientId: string; requestedBy: string; requestType: string }) =>
      apiClient.post<DocumentRequestDTO>("/document-requests", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document-requests"] });
    },
  });
}
