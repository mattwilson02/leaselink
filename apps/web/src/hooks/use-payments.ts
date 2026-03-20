"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { Payment, PaginatedResponse } from "@leaselink/shared";

interface PaymentFilters {
  status?: string;
  leaseId?: string;
  tenantId?: string;
  propertyId?: string;
  page?: number;
  pageSize?: number;
}

function buildQueryString(filters: PaymentFilters): string {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.leaseId) params.set("leaseId", filters.leaseId);
  if (filters.tenantId) params.set("tenantId", filters.tenantId);
  if (filters.propertyId) params.set("propertyId", filters.propertyId);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.pageSize) params.set("pageSize", String(filters.pageSize));
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function usePayments(filters: PaymentFilters = {}) {
  return useQuery({
    queryKey: ["payments", filters],
    queryFn: () =>
      apiClient.get<{ payments: Payment[]; totalCount: number }>(
        `/payments${buildQueryString(filters)}`
      ),
  });
}

export function usePayment(id: string) {
  return useQuery({
    queryKey: ["payments", id],
    queryFn: () => apiClient.get<{ payment: Payment }>(`/payments/${id}`),
    enabled: !!id,
  });
}

export function useGeneratePayments() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { leaseId: string }) =>
      apiClient.post<{ paymentsGenerated: number }>("/payments/generate", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
    },
  });
}

export function useMarkOverduePayments() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiClient.post<{ overdueCount: number }>("/payments/mark-overdue"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
    },
  });
}
