"use client";

import { Badge } from "@/components/ui/badge";
import { PropertyStatus, PROPERTY_STATUS_LABELS } from "@leaselink/shared";

const statusVariant: Record<
  PropertyStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  [PropertyStatus.VACANT]: "outline",
  [PropertyStatus.LISTED]: "default",
  [PropertyStatus.OCCUPIED]: "secondary",
  [PropertyStatus.MAINTENANCE]: "destructive",
};

interface PropertyStatusBadgeProps {
  status: PropertyStatus;
}

export function PropertyStatusBadge({ status }: PropertyStatusBadgeProps) {
  return (
    <Badge variant={statusVariant[status]}>
      {PROPERTY_STATUS_LABELS[status]}
    </Badge>
  );
}
