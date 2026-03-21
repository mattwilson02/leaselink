"use client";

import { Badge } from "@/components/ui/badge";
import { MaintenanceCategory, MAINTENANCE_CATEGORY_LABELS } from "@leaselink/shared";

interface VendorSpecialtyBadgeProps {
  specialty: string;
}

const specialtyStyles: Record<MaintenanceCategory, string> = {
  [MaintenanceCategory.PLUMBING]:
    "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400",
  [MaintenanceCategory.ELECTRICAL]:
    "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400",
  [MaintenanceCategory.HVAC]:
    "bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900/30 dark:text-teal-400",
  [MaintenanceCategory.APPLIANCE]:
    "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400",
  [MaintenanceCategory.STRUCTURAL]:
    "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400",
  [MaintenanceCategory.PEST_CONTROL]:
    "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400",
  [MaintenanceCategory.OTHER]:
    "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400",
};

export function VendorSpecialtyBadge({ specialty }: VendorSpecialtyBadgeProps) {
  const label =
    MAINTENANCE_CATEGORY_LABELS[specialty as MaintenanceCategory] ?? specialty;
  const className =
    specialtyStyles[specialty as MaintenanceCategory] ??
    "bg-gray-100 text-gray-600 border-gray-200";

  return (
    <Badge variant="outline" className={className}>
      {label}
    </Badge>
  );
}
