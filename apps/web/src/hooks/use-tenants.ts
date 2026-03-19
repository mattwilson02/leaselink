"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { Tenant, PaginatedResponse } from "@leaselink/shared";

interface TenantFilters {
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

function buildQueryString(filters: TenantFilters): string {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.search) params.set("search", filters.search);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.pageSize) params.set("pageSize", String(filters.pageSize));
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function useTenants(filters: TenantFilters = {}) {
  return useQuery({
    queryKey: ["tenants", filters],
    queryFn: () =>
      apiClient.get<PaginatedResponse<Tenant>>(
        `/tenants${buildQueryString(filters)}`
      ),
  });
}

export function useTenant(id: string) {
  return useQuery({
    queryKey: ["tenants", id],
    queryFn: () => apiClient.get<{ data: Tenant }>(`/tenants/${id}`),
    enabled: !!id,
  });
}

export function useCreateTenant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiClient.post<{ data: Tenant }>("/clients", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
    },
  });
}

export function useDeleteTenant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/clients/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
    },
  });
}
