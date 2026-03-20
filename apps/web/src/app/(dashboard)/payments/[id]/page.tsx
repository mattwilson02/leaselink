"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { PaymentStatusBadge } from "@/components/payments/payment-status-badge";
import { usePayment } from "@/hooks/use-payments";

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

export default function PaymentDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const { data: paymentData, isLoading } = usePayment(id);
  const payment = paymentData?.payment;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Card>
          <CardContent className="space-y-4 pt-6">
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-32" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Payment not found</h1>
        <Link href="/payments">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Payments
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link href="/payments">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              Payment &mdash; {formatCurrency(payment.amount)}
            </h1>
            <PaymentStatusBadge status={payment.status} />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-medium">Lease</p>
                  <Link
                    href={`/leases/${payment.leaseId}`}
                    className="text-sm text-muted-foreground hover:underline flex items-center gap-1"
                  >
                    {payment.leaseId.slice(0, 8)}...
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
                <div>
                  <p className="text-sm font-medium">Amount</p>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(payment.amount)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Due Date</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(payment.dueDate)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Status</p>
                  <div className="mt-1">
                    <PaymentStatusBadge status={payment.status} />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium">Paid At</p>
                  <p className="text-sm text-muted-foreground">
                    {payment.paidAt ? formatDate(payment.paidAt) : "\u2014"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Created At</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(payment.createdAt)}
                  </p>
                </div>
              </div>

              {payment.stripeCheckoutSessionId && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium">Stripe Checkout Session</p>
                    <p className="text-sm text-muted-foreground font-mono break-all">
                      {payment.stripeCheckoutSessionId}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent>
              <PaymentStatusBadge status={payment.status} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lease</CardTitle>
            </CardHeader>
            <CardContent>
              <Link
                href={`/leases/${payment.leaseId}`}
                className="text-sm hover:underline flex items-center gap-1"
              >
                View Lease
                <ExternalLink className="h-3 w-3" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
