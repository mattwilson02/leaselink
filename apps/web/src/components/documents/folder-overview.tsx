"use client";

import {
  BadgeCheck,
  FileText,
  FilePen,
  ClipboardCheck,
  Shield,
  Folder,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DocumentFolder, DOCUMENT_FOLDER_LABELS } from "@leaselink/shared";
import type { FolderSummaryItem } from "@/hooks/use-documents";
import { cn } from "@/lib/utils";

const folderIcons: Record<DocumentFolder, React.ElementType> = {
  [DocumentFolder.IDENTIFICATION]: BadgeCheck,
  [DocumentFolder.LEASE_AGREEMENTS]: FileText,
  [DocumentFolder.SIGNED_DOCUMENTS]: FilePen,
  [DocumentFolder.INSPECTION_REPORTS]: ClipboardCheck,
  [DocumentFolder.INSURANCE]: Shield,
  [DocumentFolder.OTHER]: Folder,
};

const folderColors: Record<DocumentFolder, string> = {
  [DocumentFolder.IDENTIFICATION]: "text-blue-600 bg-blue-50",
  [DocumentFolder.LEASE_AGREEMENTS]: "text-green-600 bg-green-50",
  [DocumentFolder.SIGNED_DOCUMENTS]: "text-amber-600 bg-amber-50",
  [DocumentFolder.INSPECTION_REPORTS]: "text-purple-600 bg-purple-50",
  [DocumentFolder.INSURANCE]: "text-teal-600 bg-teal-50",
  [DocumentFolder.OTHER]: "text-gray-600 bg-gray-50",
};

interface FolderOverviewProps {
  items: FolderSummaryItem[];
  isLoading?: boolean;
}

export function FolderOverview({ items, isLoading }: FolderOverviewProps) {
  const allFolders = Object.values(DocumentFolder);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {allFolders.map((folder) => (
          <Card key={folder}>
            <CardContent className="pt-4 pb-4">
              <Skeleton className="h-8 w-8 rounded-md mb-3" />
              <Skeleton className="h-4 w-20 mb-1" />
              <Skeleton className="h-3 w-12" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const summaryByFolder = Object.fromEntries(
    items.map((item) => [item.folderName, item])
  );

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      {allFolders.map((folder) => {
        const summary = summaryByFolder[folder];
        const Icon = folderIcons[folder];
        const colorClass = folderColors[folder];
        const count = summary?.fileCount ?? 0;

        return (
          <Card key={folder} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-4 pb-4">
              <div
                className={cn(
                  "inline-flex h-8 w-8 items-center justify-center rounded-md mb-3",
                  colorClass
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              <p className="text-sm font-medium leading-tight">
                {DOCUMENT_FOLDER_LABELS[folder]}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {count} {count === 1 ? "document" : "documents"}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
