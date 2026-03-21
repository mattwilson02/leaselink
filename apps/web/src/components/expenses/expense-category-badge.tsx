"use client";

import { Badge } from "@/components/ui/badge";
import { ExpenseCategory, EXPENSE_CATEGORY_LABELS } from "@leaselink/shared";

interface ExpenseCategoryBadgeProps {
  category: string;
}

const categoryStyles: Record<ExpenseCategory, string> = {
  [ExpenseCategory.MAINTENANCE]:
    "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400",
  [ExpenseCategory.INSURANCE]:
    "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400",
  [ExpenseCategory.TAX]:
    "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400",
  [ExpenseCategory.UTILITY]:
    "bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900/30 dark:text-teal-400",
  [ExpenseCategory.MANAGEMENT_FEE]:
    "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300",
  [ExpenseCategory.REPAIR]:
    "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400",
  [ExpenseCategory.IMPROVEMENT]:
    "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400",
  [ExpenseCategory.OTHER]:
    "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400",
};

export function ExpenseCategoryBadge({ category }: ExpenseCategoryBadgeProps) {
  const label =
    EXPENSE_CATEGORY_LABELS[category as ExpenseCategory] ?? category;
  const className =
    categoryStyles[category as ExpenseCategory] ??
    "bg-gray-100 text-gray-600 border-gray-200";

  return (
    <Badge variant="outline" className={className}>
      {label}
    </Badge>
  );
}
