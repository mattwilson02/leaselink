"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PaymentStatus } from "@leaselink/shared";
import type { Payment } from "@leaselink/shared";

interface PaymentSummaryCardsProps {
  payments: Payment[];
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function PaymentSummaryCards({ payments }: PaymentSummaryCardsProps) {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
  const nextMonthYear = currentMonth === 11 ? currentYear + 1 : currentYear;

  const isCurrentMonth = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  };

  const isNextMonth = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.getMonth() === nextMonth && d.getFullYear() === nextMonthYear;
  };

  const expectedThisMonth = payments
    .filter(
      (p) =>
        isCurrentMonth(p.dueDate) &&
        (p.status === PaymentStatus.PENDING ||
          p.status === PaymentStatus.UPCOMING)
    )
    .reduce((sum, p) => sum + p.amount, 0);

  const collectedThisMonth = payments
    .filter(
      (p) => isCurrentMonth(p.dueDate) && p.status === PaymentStatus.PAID
    )
    .reduce((sum, p) => sum + p.amount, 0);

  const overduePayments = payments.filter(
    (p) => p.status === PaymentStatus.OVERDUE
  );
  const overdueCount = overduePayments.length;
  const overdueSum = overduePayments.reduce((sum, p) => sum + p.amount, 0);

  const upcomingNextMonth = payments.filter(
    (p) =>
      isNextMonth(p.dueDate) && p.status === PaymentStatus.UPCOMING
  ).length;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Expected This Month
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{formatCurrency(expectedThisMonth)}</p>
          <p className="text-xs text-muted-foreground mt-1">Pending + Upcoming</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Collected This Month
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(collectedThisMonth)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Paid payments</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Overdue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-red-600">
            {formatCurrency(overdueSum)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {overdueCount} {overdueCount === 1 ? "payment" : "payments"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Upcoming Next Month
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{upcomingNextMonth}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {upcomingNextMonth === 1 ? "payment" : "payments"} scheduled
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
