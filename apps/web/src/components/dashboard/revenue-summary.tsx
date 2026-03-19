"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface RevenueSummaryProps {
  expectedThisMonth: number;
  collectedThisMonth: number;
  overdueTotal: number;
  overdueCount: number;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function RevenueSummary({
  expectedThisMonth,
  collectedThisMonth,
  overdueTotal,
  overdueCount,
}: RevenueSummaryProps) {
  const hasOverdue = overdueCount > 0;

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Expected This Month
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{formatCurrency(expectedThisMonth)}</p>
          <p className="mt-1 text-xs text-muted-foreground">Total rent due this month</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Collected This Month
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{formatCurrency(collectedThisMonth)}</p>
          <p className="mt-1 text-xs text-muted-foreground">Payments received</p>
        </CardContent>
      </Card>

      <Card className={cn(hasOverdue && "border-destructive/50 bg-destructive/5")}>
        <CardHeader className="pb-2">
          <CardTitle
            className={cn(
              "text-sm font-medium",
              hasOverdue ? "text-destructive" : "text-muted-foreground"
            )}
          >
            Overdue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className={cn("text-2xl font-bold", hasOverdue && "text-destructive")}>
            {formatCurrency(overdueTotal)}
          </p>
          <p
            className={cn(
              "mt-1 text-xs",
              hasOverdue ? "text-destructive/80" : "text-muted-foreground"
            )}
          >
            {overdueCount} {overdueCount === 1 ? "payment" : "payments"} overdue
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
