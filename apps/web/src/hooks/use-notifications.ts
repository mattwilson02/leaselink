"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { PaginatedResponse } from "@leaselink/shared";

export interface Notification {
  id: string;
  personId: string;
  title: string;
  body: string;
  notificationType: string;
  actionType: string | null;
  linkedDocumentId: string | null;
  linkedMaintenanceRequestId: string | null;
  linkedPaymentId: string | null;
  isRead: boolean;
  isActionComplete: boolean;
  createdAt: string;
  updatedAt: string | null;
  archivedAt: string | null;
}

interface NotificationParams {
  page?: number;
  pageSize?: number;
  notificationType?: string;
  isArchived?: boolean;
}

function buildQueryString(params: NotificationParams): string {
  const qs = new URLSearchParams();
  if (params.page !== undefined) qs.set("page", String(params.page));
  if (params.pageSize !== undefined) qs.set("pageSize", String(params.pageSize));
  if (params.notificationType) qs.set("notificationType", params.notificationType);
  if (params.isArchived !== undefined) qs.set("isArchived", String(params.isArchived));
  const str = qs.toString();
  return str ? `?${str}` : "";
}

export function useNotifications(params: NotificationParams = {}) {
  return useQuery({
    queryKey: ["notifications", params],
    queryFn: async () => {
      try {
        const data = await apiClient.get<PaginatedResponse<Notification>>(
          `/notifications${buildQueryString(params)}`
        );
        return data ?? { data: [], meta: { page: 1, pageSize: 10, totalCount: 0, totalPages: 0 } };
      } catch {
        return { data: [], meta: { page: 1, pageSize: 10, totalCount: 0, totalPages: 0 } } as PaginatedResponse<Notification>;
      }
    },
  });
}

export function useHasUnreadNotifications() {
  return useQuery({
    queryKey: ["notifications", "unread"],
    queryFn: () =>
      apiClient.get<{ hasUnreadNotifications: boolean }>(
        "/has-notifications-unread"
      ),
    refetchInterval: 30_000,
    select: (data) => data.hasUnreadNotifications,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.patch(`/notifications/${id}`, { isRead: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiClient.patch<{ count: number }>("/mark-all-notifications-as-read"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
