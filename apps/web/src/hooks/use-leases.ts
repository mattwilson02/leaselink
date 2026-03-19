"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { Lease, PaginatedResponse } from "@leaselink/shared";

interface LeaseFilters {
  status?: string;
  propertyId?: string;
  tenantId?: string;
  page?: number;
  pageSize?: number;
}

function buildQueryString(filters: LeaseFilters): string {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.propertyId) params.set("propertyId", filters.propertyId);
  if (filters.tenantId) params.set("tenantId", filters.tenantId);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.pageSize) params.set("pageSize", String(filters.pageSize));
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function useLeases(filters: LeaseFilters = {}) {
  return useQuery({
    queryKey: ["leases", filters],
    queryFn: () =>
      apiClient.get<PaginatedResponse<Lease>>(
        `/leases${buildQueryString(filters)}`
      ),
  });
}

export function useLease(id: string) {
  return useQuery({
    queryKey: ["leases", id],
    queryFn: () => apiClient.get<{ data: Lease }>(`/leases/${id}`),
    enabled: !!id,
  });
}

export function useActiveLeaseByProperty(propertyId: string) {
  return useQuery({
    queryKey: ["leases", "property", propertyId],
    queryFn: () =>
      apiClient.get<{ data: Lease | null }>(
        `/properties/${propertyId}/active-lease`
      ),
    enabled: !!propertyId,
  });
}

export function useCreateLease() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiClient.post<{ data: Lease }>("/leases", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leases"] });
      queryClient.invalidateQueries({ queryKey: ["properties"] });
    },
  });
}

export function useUpdateLeaseStatus(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (status: string) =>
      apiClient.patch<{ data: Lease }>(`/leases/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leases"] });
      queryClient.invalidateQueries({ queryKey: ["properties"] });
    },
  });
}

export function useRenewLease(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiClient.post<{ data: Lease }>(`/leases/${id}/renew`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leases"] });
      queryClient.invalidateQueries({ queryKey: ["properties"] });
    },
  });
}
