"use client";

import { Badge } from "@/components/ui/badge";
import { DocumentFolder, DOCUMENT_FOLDER_LABELS } from "@leaselink/shared";
import { cn } from "@/lib/utils";

const folderStyles: Record<DocumentFolder, string> = {
  [DocumentFolder.IDENTIFICATION]:
    "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100",
  [DocumentFolder.LEASE_AGREEMENTS]:
    "bg-green-100 text-green-800 border-green-200 hover:bg-green-100",
  [DocumentFolder.SIGNED_DOCUMENTS]:
    "bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100",
  [DocumentFolder.INSPECTION_REPORTS]:
    "bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-100",
  [DocumentFolder.INSURANCE]:
    "bg-teal-100 text-teal-800 border-teal-200 hover:bg-teal-100",
  [DocumentFolder.OTHER]: "",
};

interface DocumentFolderBadgeProps {
  folder: DocumentFolder | string;
}

export function DocumentFolderBadge({ folder }: DocumentFolderBadgeProps) {
  const folderKey = folder as DocumentFolder;
  const customStyle = folderStyles[folderKey] ?? "";
  const variant =
    folder === DocumentFolder.OTHER ? "outline" : "secondary";

  return (
    <Badge variant={variant} className={cn(customStyle)}>
      {DOCUMENT_FOLDER_LABELS[folderKey] ?? folder}
    </Badge>
  );
}
