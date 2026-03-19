"use client";

import { Badge } from "@/components/ui/badge";
import {
  DocumentRequestStatus,
  DOCUMENT_REQUEST_STATUS_LABELS,
} from "@leaselink/shared";
import { cn } from "@/lib/utils";

const statusStyles: Record<DocumentRequestStatus, string> = {
  [DocumentRequestStatus.PENDING]:
    "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100",
  [DocumentRequestStatus.UPLOADED]:
    "bg-green-100 text-green-800 border-green-200 hover:bg-green-100",
  [DocumentRequestStatus.CANCELED]: "",
};

interface DocumentRequestStatusBadgeProps {
  status: DocumentRequestStatus | string;
}

export function DocumentRequestStatusBadge({
  status,
}: DocumentRequestStatusBadgeProps) {
  const statusKey = status as DocumentRequestStatus;
  const customStyle = statusStyles[statusKey] ?? "";
  const variant =
    status === DocumentRequestStatus.CANCELED ? "outline" : "secondary";

  return (
    <Badge variant={variant} className={cn(customStyle)}>
      {DOCUMENT_REQUEST_STATUS_LABELS[statusKey] ?? status}
    </Badge>
  );
}
