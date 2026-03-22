"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { AuditLog } from "@leaselink/shared";

// GET /audit-logs returns: { data: AuditLogHttpResponse[], meta: { page, pageSize, totalCount, totalPages } }
// GET /audit-logs/:resourceType/:resourceId returns: { data: AuditLogHttpResponse[], meta: { page, pageSize, totalCount, totalPages } }

interface AuditLogFilters {
  resourceType?: string;
  resourceId?: string;
  action?: string;
  actorId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

interface AuditLogListResponse {
  data: AuditLog[];
  meta: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}

function buildQueryString(filters: AuditLogFilters): string {
  const params = new URLSearchParams();
  if (filters.resourceType) params.set("resourceType", filters.resourceType);
  if (filters.resourceId) params.set("resourceId", filters.resourceId);
  if (filters.action) params.set("action", filters.action);
  if (filters.actorId) params.set("actorId", filters.actorId);
  if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
  if (filters.dateTo) params.set("dateTo", filters.dateTo);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.pageSize) params.set("pageSize", String(filters.pageSize));
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function useAuditLogs(filters: AuditLogFilters = {}) {
  return useQuery({
    queryKey: ["audit-logs", filters],
    queryFn: () =>
      apiClient.get<AuditLogListResponse>(
        `/audit-logs${buildQueryString(filters)}`
      ),
  });
}

export function useAuditLogsByResource(
  resourceType: string,
  resourceId: string,
  page = 1,
  pageSize = 20
) {
  return useQuery({
    queryKey: ["audit-logs", "resource", resourceType, resourceId, page, pageSize],
    queryFn: () =>
      apiClient.get<AuditLogListResponse>(
        `/audit-logs/${resourceType}/${resourceId}?page=${page}&pageSize=${pageSize}`
      ),
    enabled: !!resourceType && !!resourceId,
  });
}
