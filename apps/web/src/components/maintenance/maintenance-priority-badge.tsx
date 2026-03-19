"use client";

import { Badge } from "@/components/ui/badge";
import { MaintenancePriority, MAINTENANCE_PRIORITY_LABELS } from "@leaselink/shared";
import { cn } from "@/lib/utils";

const priorityStyles: Record<
  MaintenancePriority,
  { variant: "default" | "secondary" | "destructive" | "outline"; className?: string }
> = {
  [MaintenancePriority.LOW]: { variant: "outline" },
  [MaintenancePriority.MEDIUM]: { variant: "default" },
  [MaintenancePriority.HIGH]: {
    variant: "secondary",
    className: "bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-100",
  },
  [MaintenancePriority.EMERGENCY]: { variant: "destructive" },
};

interface MaintenancePriorityBadgeProps {
  priority: MaintenancePriority;
}

export function MaintenancePriorityBadge({ priority }: MaintenancePriorityBadgeProps) {
  const { variant, className } = priorityStyles[priority];

  return (
    <Badge variant={variant} className={cn(className)}>
      {MAINTENANCE_PRIORITY_LABELS[priority]}
    </Badge>
  );
}
