"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { Vendor } from "@leaselink/shared";

// GET /vendors returns: { data: VendorHttpResponse[], meta: { page, pageSize, totalCount, totalPages } }
// GET /vendors/:id returns: { data: VendorHttpResponse }
// POST /vendors returns: { vendor: VendorHttpResponse }
// PUT /vendors/:id returns: { vendor: VendorHttpResponse }
// DELETE /vendors/:id returns: 204 No Content

interface VendorFilters {
  specialty?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

interface VendorListResponse {
  data: Vendor[];
  meta: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}

interface VendorResponse {
  data: Vendor;
}

interface VendorMutationResponse {
  vendor: Vendor;
}

function buildQueryString(filters: VendorFilters): string {
  const params = new URLSearchParams();
  if (filters.specialty) params.set("specialty", filters.specialty);
  if (filters.search) params.set("search", filters.search);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.pageSize) params.set("pageSize", String(filters.pageSize));
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function useVendors(filters: VendorFilters = {}) {
  return useQuery({
    queryKey: ["vendors", filters],
    queryFn: () =>
      apiClient.get<VendorListResponse>(`/vendors${buildQueryString(filters)}`),
  });
}

export function useVendor(id: string) {
  return useQuery({
    queryKey: ["vendors", id],
    queryFn: () => apiClient.get<VendorResponse>(`/vendors/${id}`),
    enabled: !!id,
  });
}

export function useCreateVendor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      name: string;
      specialty: string;
      phone?: string;
      email?: string;
      notes?: string;
    }) => apiClient.post<VendorMutationResponse>("/vendors", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
    },
  });
}

export function useUpdateVendor(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      name?: string;
      specialty?: string;
      phone?: string | null;
      email?: string | null;
      notes?: string | null;
    }) => apiClient.put<VendorMutationResponse>(`/vendors/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
    },
  });
}

export function useDeleteVendor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete<void>(`/vendors/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
    },
  });
}
