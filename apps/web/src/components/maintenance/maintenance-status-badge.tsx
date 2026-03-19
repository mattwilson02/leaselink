"use client";

import { Badge } from "@/components/ui/badge";
import { MaintenanceStatus, MAINTENANCE_STATUS_LABELS } from "@leaselink/shared";
import { cn } from "@/lib/utils";

const statusStyles: Record<MaintenanceStatus, string> = {
  [MaintenanceStatus.OPEN]: "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100",
  [MaintenanceStatus.IN_PROGRESS]:
    "bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100",
  [MaintenanceStatus.RESOLVED]:
    "bg-green-100 text-green-800 border-green-200 hover:bg-green-100",
  [MaintenanceStatus.CLOSED]: "",
};

interface MaintenanceStatusBadgeProps {
  status: MaintenanceStatus;
}

export function MaintenanceStatusBadge({ status }: MaintenanceStatusBadgeProps) {
  const customStyle = statusStyles[status];
  const variant =
    status === MaintenanceStatus.CLOSED ? "outline" : "secondary";

  return (
    <Badge variant={variant} className={cn(customStyle)}>
      {MAINTENANCE_STATUS_LABELS[status]}
    </Badge>
  );
}
