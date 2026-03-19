"use client";

import { Badge } from "@/components/ui/badge";
import { PaymentStatus, PAYMENT_STATUS_LABELS } from "@leaselink/shared";
import { cn } from "@/lib/utils";

const statusConfig: Record<
  PaymentStatus,
  {
    variant: "default" | "secondary" | "destructive" | "outline";
    className?: string;
  }
> = {
  [PaymentStatus.UPCOMING]: { variant: "outline" },
  [PaymentStatus.PENDING]: { variant: "secondary" },
  [PaymentStatus.PAID]: {
    variant: "default",
    className: "bg-green-600 text-white hover:bg-green-700",
  },
  [PaymentStatus.OVERDUE]: { variant: "destructive" },
};

interface PaymentStatusBadgeProps {
  status: PaymentStatus | string;
}

export function PaymentStatusBadge({ status }: PaymentStatusBadgeProps) {
  const config = statusConfig[status as PaymentStatus] ?? { variant: "outline" as const };
  const label =
    PAYMENT_STATUS_LABELS[status as PaymentStatus] ?? status;

  return (
    <Badge variant={config.variant} className={cn(config.className)}>
      {label}
    </Badge>
  );
}
