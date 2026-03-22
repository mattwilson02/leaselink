"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { Expense } from "@leaselink/shared";

// Controller returns:
// GET /expenses -> { data: ExpenseHttpResponse[], meta: { page, pageSize, totalCount, totalPages } }
// GET /expenses/:id -> { data: ExpenseHttpResponse }
// GET /expenses/summary -> { summary: ExpenseSummaryResult[] }
// POST /expenses -> { expense: ExpenseHttpResponse }
// PUT /expenses/:id -> { expense: ExpenseHttpResponse }
// DELETE /expenses/:id -> 204 No Content

interface ExpenseSummaryResult {
  propertyId: string;
  propertyAddress: string;
  totalAmount: number;
  count: number;
}

interface ExpenseListResponse {
  data: Expense[];
  meta: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}

interface ExpenseFilters {
  propertyId?: string;
  category?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

function buildQueryString(filters: ExpenseFilters): string {
  const params = new URLSearchParams();
  if (filters.propertyId) params.set("propertyId", filters.propertyId);
  if (filters.category) params.set("category", filters.category);
  if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
  if (filters.dateTo) params.set("dateTo", filters.dateTo);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.pageSize) params.set("pageSize", String(filters.pageSize));
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function useExpenses(filters: ExpenseFilters = {}) {
  return useQuery({
    queryKey: ["expenses", filters],
    queryFn: () =>
      apiClient.get<ExpenseListResponse>(
        `/expenses${buildQueryString(filters)}`
      ),
  });
}

export function useExpense(id: string) {
  return useQuery({
    queryKey: ["expenses", id],
    queryFn: () => apiClient.get<{ data: Expense }>(`/expenses/${id}`),
    enabled: !!id,
  });
}

export function useExpenseSummary(startDate?: string, endDate?: string) {
  const params = new URLSearchParams();
  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);
  const qs = params.toString();
  const url = `/expenses/summary${qs ? `?${qs}` : ""}`;

  return useQuery({
    queryKey: ["expenses", "summary", startDate, endDate],
    queryFn: () =>
      apiClient.get<{ summary: ExpenseSummaryResult[] }>(url),
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiClient.post<{ expense: Expense }>("/expenses", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
  });
}

export function useUpdateExpense(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiClient.put<{ expense: Expense }>(`/expenses/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/expenses/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
  });
}

export function useUploadExpenseReceipt(id: string) {
  return useMutation({
    mutationFn: (data: { fileName: string; contentType: string }) =>
      apiClient.post<{ uploadUrl: string; blobKey: string }>(
        `/expenses/${id}/receipt`,
        data
      ),
  });
}

export function useConfirmExpenseReceipt(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { blobKey: string }) =>
      apiClient.post<{ expense: Expense }>(
        `/expenses/${id}/receipt/confirm`,
        data
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
  });
}
