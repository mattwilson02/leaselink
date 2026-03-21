"use client";

import { Badge } from "@/components/ui/badge";
import { AuditResourceType, AUDIT_RESOURCE_TYPE_LABELS } from "@leaselink/shared";

interface AuditResourceBadgeProps {
  resourceType: string;
}

const resourceStyles: Record<AuditResourceType, string> = {
  [AuditResourceType.PROPERTY]:
    "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400",
  [AuditResourceType.LEASE]:
    "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400",
  [AuditResourceType.TENANT]:
    "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400",
  [AuditResourceType.PAYMENT]:
    "bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900/30 dark:text-teal-400",
  [AuditResourceType.MAINTENANCE_REQUEST]:
    "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400",
  [AuditResourceType.DOCUMENT]:
    "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300",
  [AuditResourceType.EXPENSE]:
    "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400",
  [AuditResourceType.VENDOR]:
    "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400",
};

export function AuditResourceBadge({ resourceType }: AuditResourceBadgeProps) {
  const label =
    AUDIT_RESOURCE_TYPE_LABELS[resourceType as AuditResourceType] ??
    resourceType;
  const className =
    resourceStyles[resourceType as AuditResourceType] ??
    "bg-gray-100 text-gray-600 border-gray-200";

  return (
    <Badge variant="outline" className={className}>
      {label}
    </Badge>
  );
}
