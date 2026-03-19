"use client";

import { Badge } from "@/components/ui/badge";
import { TenantStatus, TENANT_STATUS_LABELS } from "@leaselink/shared";

const statusVariant: Record<
  TenantStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  [TenantStatus.INVITED]: "secondary",
  [TenantStatus.ACTIVE]: "default",
  [TenantStatus.INACTIVE]: "outline",
};

const statusClassName: Record<TenantStatus, string> = {
  [TenantStatus.INVITED]: "",
  [TenantStatus.ACTIVE]: "bg-green-600 text-white hover:bg-green-700",
  [TenantStatus.INACTIVE]: "",
};

interface TenantStatusBadgeProps {
  status: TenantStatus;
}

export function TenantStatusBadge({ status }: TenantStatusBadgeProps) {
  return (
    <Badge
      variant={statusVariant[status]}
      className={statusClassName[status]}
    >
      {TENANT_STATUS_LABELS[status]}
    </Badge>
  );
}
