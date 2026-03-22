"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { PaginatedResponse } from "@leaselink/shared";

export interface DocumentDTO {
  id: string;
  name: string;
  contentKey: string;
  uploadedBy: string;
  blobName: string;
  fileSize: number;
  thumbnailBlobName: string | null;
  folder: string;
  clientId: string;
  version: number;
  createdAt: string;
  updatedAt: string | null;
  viewedAt: string | null;
}

export interface FolderSummaryItem {
  folderName: string;
  fileCount: number;
  totalFileSizeSum: number;
  mostRecentUpdatedDate: string | null;
}

interface DocumentFilters {
  page?: number;
  pageSize?: number;
  search?: string;
  folders?: string[];
  createdAtFrom?: string;
  createdAtTo?: string;
}

function buildQueryString(filters: DocumentFilters): string {
  const params = new URLSearchParams();
  if (filters.page !== undefined) params.set("page", String(filters.page));
  if (filters.pageSize !== undefined) params.set("pageSize", String(filters.pageSize));
  if (filters.search) params.set("search", filters.search);
  if (filters.createdAtFrom) params.set("createdAtFrom", filters.createdAtFrom);
  if (filters.createdAtTo) params.set("createdAtTo", filters.createdAtTo);
  if (filters.folders && filters.folders.length > 0) {
    filters.folders.forEach((folder) => params.append("folders", folder));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function useDocuments(params: DocumentFilters = {}) {
  return useQuery({
    queryKey: ["documents", params],
    queryFn: () =>
      apiClient.get<PaginatedResponse<DocumentDTO>>(
        `/documents${buildQueryString(params)}`
      ),
  });
}

export function useDocument(id: string) {
  return useQuery({
    queryKey: ["documents", id],
    queryFn: () =>
      apiClient.get<{ data: DocumentDTO }>(`/documents/${id}`),
    enabled: !!id,
  });
}

export function useFolderSummary() {
  return useQuery({
    queryKey: ["documents", "folder-summary"],
    queryFn: async () => {
      const data = await apiClient.get<{ documentsByFolder: FolderSummaryItem[] }>(
        "/documents/folder-summary"
      );
      return data ?? { documentsByFolder: [] };
    },
  });
}

export function useDocumentDownload() {
  return useMutation({
    mutationFn: (documentId: string) =>
      apiClient.post<{ downloadUrl: string }>("/documents/download", {
        documentId,
      }),
  });
}

export function useUploadDocument() {
  return useMutation({
    mutationFn: (documentRequestId: string) =>
      apiClient.post<{ uploadUrl: string; thumbnailUploadUrl?: string }>(
        "/documents/upload",
        { documentRequestId }
      ),
  });
}
