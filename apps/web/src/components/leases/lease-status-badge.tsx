"use client";

import { Badge } from "@/components/ui/badge";
import { LeaseStatus, LEASE_STATUS_LABELS } from "@leaselink/shared";
import { cn } from "@/lib/utils";

const statusVariant: Record<
  LeaseStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  [LeaseStatus.PENDING]: "secondary",
  [LeaseStatus.ACTIVE]: "default",
  [LeaseStatus.EXPIRED]: "outline",
  [LeaseStatus.TERMINATED]: "destructive",
};

interface LeaseStatusBadgeProps {
  status: LeaseStatus;
  endDate?: string;
}

export function LeaseStatusBadge({ status, endDate }: LeaseStatusBadgeProps) {
  let expiryClass = "";
  if (status === LeaseStatus.ACTIVE && endDate) {
    const now = new Date();
    const end = new Date(endDate);
    const daysUntilExpiry = Math.floor(
      (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysUntilExpiry <= 30) {
      expiryClass = "bg-red-600 text-white hover:bg-red-700";
    } else if (daysUntilExpiry <= 60) {
      expiryClass = "bg-yellow-500 text-white hover:bg-yellow-600";
    } else {
      expiryClass = "bg-green-600 text-white hover:bg-green-700";
    }
  }

  return (
    <Badge
      variant={statusVariant[status]}
      className={cn(expiryClass)}
    >
      {LEASE_STATUS_LABELS[status]}
    </Badge>
  );
}
