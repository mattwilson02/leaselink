"use client";

import { MaintenanceCategory, MAINTENANCE_CATEGORY_LABELS } from "@leaselink/shared";

interface MaintenanceCategoryLabelProps {
  category: MaintenanceCategory;
}

export function MaintenanceCategoryLabel({ category }: MaintenanceCategoryLabelProps) {
  return (
    <span className="text-sm text-muted-foreground">
      {MAINTENANCE_CATEGORY_LABELS[category]}
    </span>
  );
}
