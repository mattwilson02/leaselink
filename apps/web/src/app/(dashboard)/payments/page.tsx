"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, AlertCircle, Zap, Download } from "lucide-react";
import Cookies from "js-cookie";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { PaymentStatusBadge } from "@/components/payments/payment-status-badge";
import { PaymentSummaryCards } from "@/components/payments/payment-summary-cards";
import { GeneratePaymentsDialog } from "@/components/payments/generate-payments-dialog";
import { usePayments, useMarkOverduePayments } from "@/hooks/use-payments";
import { PaymentStatus, PAYMENT_STATUS_LABELS } from "@leaselink/shared";
import type { Payment } from "@leaselink/shared";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const ALL_STATUSES = "ALL";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(isoString: string) {
  return new Date(isoString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function PaymentsPage() {
  const [statusFilter, setStatusFilter] = useState<string>(ALL_STATUSES);
  const [page, setPage] = useState(1);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const pageSize = 20;

  const summaryQuery = usePayments({ pageSize: 200 });
  const allPayments = summaryQuery.data?.data ?? [];

  const tableFilters = {
    ...(statusFilter !== ALL_STATUSES ? { status: statusFilter } : {}),
    page,
    pageSize,
  };
  const { data: paymentsData, isLoading } = usePayments(tableFilters);
  const payments = paymentsData?.data ?? [];
  const totalCount = paymentsData?.meta?.totalCount ?? 0;
  const totalPages = paymentsData?.meta?.totalPages ?? 1;

  const markOverdueMutation = useMarkOverduePayments();
  const [isExporting, setIsExporting] = useState(false);

  async function handleExportCsv() {
    setIsExporting(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== ALL_STATUSES) params.set("status", statusFilter);
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333";
      const url = `${baseUrl}/payments/export${params.toString() ? `?${params.toString()}` : ""}`;
      const token = Cookies.get("auth_token");
      const headers: HeadersInit = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const response = await fetch(url, { headers });
      if (!response.ok) throw new Error("Export failed");
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = `payments-export.csv`;
      a.click();
      URL.revokeObjectURL(objectUrl);
    } finally {
      setIsExporting(false);
    }
  }

  function handleMarkOverdue() {
    markOverdueMutation.mutate(undefined, {
      onSuccess: (result) => {
        const count = result?.overdueCount ?? 0;
        toast.success(
          count > 0
            ? `${count} payment${count === 1 ? "" : "s"} marked overdue.`
            : "No payments needed to be marked overdue."
        );
      },
      onError: (err) => {
        toast.error(
          err instanceof Error ? err.message : "Failed to mark overdue payments."
        );
      },
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Payments</h1>
      </div>

      <PaymentSummaryCards payments={allPayments} />

      <div className="rounded-md border bg-muted/40 px-4 py-3">
        <p className="mb-3 text-xs text-muted-foreground">
          These actions run automatically. Use manual triggers only if needed.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkOverdue}
            disabled={markOverdueMutation.isPending}
          >
            <AlertCircle className="mr-2 h-3.5 w-3.5" />
            {markOverdueMutation.isPending ? "Processing..." : "Mark Overdue"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowGenerateDialog(true)}
          >
            <Zap className="mr-2 h-3.5 w-3.5" />
            Generate Payments
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            disabled={isExporting}
          >
            <Download className="mr-2 h-3.5 w-3.5" />
            {isExporting ? "Exporting..." : "Download CSV"}
          </Button>
        </div>
      </div>


      <div className="flex flex-col gap-4 sm:flex-row">
        <Select
          value={statusFilter}
          onValueChange={(value) => {
            setStatusFilter(value ?? ALL_STATUSES);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by status">
              {(value: string) => value === ALL_STATUSES ? "All statuses" : PAYMENT_STATUS_LABELS[value as PaymentStatus] ?? value}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_STATUSES}>All statuses</SelectItem>
            {Object.values(PaymentStatus).map((status) => (
              <SelectItem key={status} value={status}>
                {PAYMENT_STATUS_LABELS[status]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Amount</TableHead>
              <TableHead className="hidden sm:table-cell">Due Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Paid At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-20" />
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-12 ml-auto" />
                  </TableCell>
                </TableRow>
              ))
            ) : payments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center">
                  <p className="text-muted-foreground">
                    {statusFilter !== ALL_STATUSES
                      ? "No payments match your filters."
                      : "No payments yet. Generate payments for a lease to get started."}
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              payments.map((payment: Payment) => (
                <TableRow
                  key={payment.id}
                  className={cn(
                    payment.status === PaymentStatus.OVERDUE &&
                      "bg-red-50 dark:bg-red-950/20 border-l-2 border-l-red-500"
                  )}
                >
                  <TableCell className="font-medium">
                    {formatCurrency(payment.amount)}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {formatDate(payment.dueDate)}
                  </TableCell>
                  <TableCell>
                    <PaymentStatusBadge status={payment.status} />
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {payment.paidAt ? formatDate(payment.paidAt) : "\u2014"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/payments/${payment.id}`}>
                      <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing page {page} of {totalPages} ({totalCount}{" "}
            {totalCount === 1 ? "payment" : "payments"})
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <GeneratePaymentsDialog
        open={showGenerateDialog}
        onOpenChange={setShowGenerateDialog}
      />
    </div>
  );
}
