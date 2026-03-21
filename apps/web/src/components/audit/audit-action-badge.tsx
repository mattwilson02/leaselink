"use client";

import { Badge } from "@/components/ui/badge";
import { AuditAction, AUDIT_ACTION_LABELS } from "@leaselink/shared";

interface AuditActionBadgeProps {
  action: string;
}

const actionStyles: Record<AuditAction, string> = {
  [AuditAction.CREATE]:
    "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400",
  [AuditAction.UPDATE]:
    "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400",
  [AuditAction.DELETE]:
    "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400",
  [AuditAction.STATUS_CHANGE]:
    "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400",
  [AuditAction.LOGIN]:
    "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300",
  [AuditAction.UPLOAD]:
    "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400",
  [AuditAction.DOWNLOAD]:
    "bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900/30 dark:text-teal-400",
  [AuditAction.SIGN]:
    "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400",
};

export function AuditActionBadge({ action }: AuditActionBadgeProps) {
  const label = AUDIT_ACTION_LABELS[action as AuditAction] ?? action;
  const className =
    actionStyles[action as AuditAction] ??
    "bg-gray-100 text-gray-600 border-gray-200";

  return (
    <Badge variant="outline" className={className}>
      {label}
    </Badge>
  );
}
