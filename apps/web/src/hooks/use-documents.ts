"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

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
  offset?: number;
  limit?: number;
  search?: string;
  folders?: string[];
  createdAtFrom?: string;
  createdAtTo?: string;
}

function buildQueryString(filters: DocumentFilters): string {
  const params = new URLSearchParams();
  if (filters.offset !== undefined) params.set("offset", String(filters.offset));
  if (filters.limit !== undefined) params.set("limit", String(filters.limit));
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
      apiClient.get<{ documents: DocumentDTO[] }>(
        `/documents${buildQueryString(params)}`
      ),
  });
}

export function useDocument(id: string) {
  return useQuery({
    queryKey: ["documents", id],
    queryFn: () =>
      apiClient.get<{ document: DocumentDTO }>(`/documents/${id}`),
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
