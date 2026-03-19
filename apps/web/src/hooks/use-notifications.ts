"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

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

interface NotificationsResponse {
  notifications: Notification[];
}

interface NotificationParams {
  offset?: number;
  limit?: number;
  notificationType?: string;
  isArchived?: boolean;
}

function buildQueryString(params: NotificationParams): string {
  const qs = new URLSearchParams();
  if (params.offset !== undefined) qs.set("offset", String(params.offset));
  if (params.limit !== undefined) qs.set("limit", String(params.limit));
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
        return await apiClient.get<NotificationsResponse>(
          `/notifications${buildQueryString(params)}`
        );
      } catch {
        // API returns 204 No Content when no notifications — treat as empty
        return { notifications: [] };
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
