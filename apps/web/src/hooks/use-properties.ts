"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type {
  Property,
  PaginatedResponse,
  PropertyStatus,
} from "@leaselink/shared";

interface PropertyFilters {
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

function buildQueryString(filters: PropertyFilters): string {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.search) params.set("search", filters.search);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.pageSize) params.set("pageSize", String(filters.pageSize));
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function useProperties(filters: PropertyFilters = {}) {
  return useQuery({
    queryKey: ["properties", filters],
    queryFn: () =>
      apiClient.get<PaginatedResponse<Property>>(
        `/properties${buildQueryString(filters)}`
      ),
  });
}

export function useProperty(id: string) {
  return useQuery({
    queryKey: ["properties", id],
    queryFn: () =>
      apiClient.get<{ data: Property }>(`/properties/${id}`),
    enabled: !!id,
  });
}

export function useCreateProperty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiClient.post<{ data: Property }>("/properties", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["properties"] });
    },
  });
}

export function useUpdateProperty(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiClient.put<{ data: Property }>(`/properties/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["properties"] });
    },
  });
}

export function useUpdatePropertyStatus(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (status: PropertyStatus) =>
      apiClient.patch<{ data: Property }>(`/properties/${id}/status`, {
        status,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["properties"] });
    },
  });
}

export function useDeleteProperty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/properties/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["properties"] });
    },
  });
}

export function useUploadPropertyPhotos(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (fileNames: string[]) =>
      apiClient.post<{ data: { uploadUrls: string[] } }>(
        `/properties/${id}/photos`,
        { fileNames }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["properties", id] });
    },
  });
}
