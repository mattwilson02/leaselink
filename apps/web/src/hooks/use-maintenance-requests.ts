"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { MaintenanceRequest, PaginatedResponse } from "@leaselink/shared";
import { MaintenanceStatus } from "@leaselink/shared";

interface MaintenanceRequestFilters {
  status?: string;
  priority?: string;
  category?: string;
  propertyId?: string;
  page?: number;
  pageSize?: number;
}

function buildQueryString(filters: MaintenanceRequestFilters): string {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.priority) params.set("priority", filters.priority);
  if (filters.category) params.set("category", filters.category);
  if (filters.propertyId) params.set("propertyId", filters.propertyId);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.pageSize) params.set("pageSize", String(filters.pageSize));
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function useMaintenanceRequests(
  filters: MaintenanceRequestFilters = {}
) {
  return useQuery({
    queryKey: ["maintenance-requests", filters],
    queryFn: () =>
      apiClient.get<{ maintenanceRequests: MaintenanceRequest[]; totalCount: number }>(
        `/maintenance-requests${buildQueryString(filters)}`
      ),
  });
}

export function useMaintenanceRequest(id: string) {
  return useQuery({
    queryKey: ["maintenance-requests", id],
    queryFn: () =>
      apiClient.get<{ maintenanceRequest: MaintenanceRequest }>(`/maintenance-requests/${id}`),
    enabled: !!id,
  });
}

export function useMaintenanceRequestsByProperty(
  propertyId: string,
  filters: Omit<MaintenanceRequestFilters, "propertyId"> = {}
) {
  return useQuery({
    queryKey: ["maintenance-requests", "property", propertyId, filters],
    queryFn: () =>
      apiClient.get<{ maintenanceRequests: MaintenanceRequest[]; totalCount: number }>(
        `/properties/${propertyId}/maintenance-requests${buildQueryString(filters)}`
      ),
    enabled: !!propertyId,
  });
}

export function useUpdateMaintenanceRequestStatus(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (status: string) =>
      apiClient.patch<{ maintenanceRequest: MaintenanceRequest }>(
        `/maintenance-requests/${id}/status`,
        { status }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance-requests"] });
    },
  });
}

export function useMaintenanceRequestsByVendor(vendorId: string) {
  return useQuery({
    queryKey: ["maintenance-requests", "vendor", vendorId],
    queryFn: async () => {
      const result = await apiClient.get<{
        maintenanceRequests: MaintenanceRequest[];
        totalCount: number;
      }>(`/maintenance-requests${buildQueryString({ pageSize: 200 })}`);
      const activeStatuses = [
        MaintenanceStatus.OPEN,
        MaintenanceStatus.IN_PROGRESS,
      ] as string[];
      return result.maintenanceRequests.filter(
        (r) => r.vendorId === vendorId && activeStatuses.includes(r.status)
      );
    },
    enabled: !!vendorId,
  });
}

export function useAssignMaintenanceVendor(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      status,
      vendorId,
    }: {
      status: string;
      vendorId: string | null;
    }) =>
      apiClient.patch<{ maintenanceRequest: MaintenanceRequest }>(
        `/maintenance-requests/${id}/status`,
        { status, vendorId }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance-requests"] });
    },
  });
}
