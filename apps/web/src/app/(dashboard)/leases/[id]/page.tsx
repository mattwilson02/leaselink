"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { LeaseStatusBadge } from "@/components/leases/lease-status-badge";
import { ActivateLeaseDialog } from "@/components/leases/activate-lease-dialog";
import { TerminateLeaseDialog } from "@/components/leases/terminate-lease-dialog";
import { useLease, useUpdateLeaseStatus } from "@/hooks/use-leases";
import { useProperty } from "@/hooks/use-properties";
import { useTenant } from "@/hooks/use-tenants";
import { LeaseStatus } from "@leaselink/shared";
import { toast } from "sonner";

function formatDate(isoString: string) {
  return new Date(isoString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatRent(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function LeaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: leaseData, isLoading } = useLease(id);
  const lease = leaseData?.data;

  const { data: propertyData } = useProperty(lease?.propertyId ?? "");
  const { data: tenantData } = useTenant(lease?.tenantId ?? "");

  const property = propertyData?.data;
  const tenant = tenantData?.data;

  const statusMutation = useUpdateLeaseStatus(id);

  const [showActivate, setShowActivate] = useState(false);
  const [showTerminate, setShowTerminate] = useState(false);

  function handleActivate() {
    statusMutation.mutate(LeaseStatus.ACTIVE, {
      onSuccess: () => {
        toast.success("Lease activated.");
        setShowActivate(false);
      },
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : "Failed to activate lease.");
      },
    });
  }

  function handleTerminate() {
    statusMutation.mutate(LeaseStatus.TERMINATED, {
      onSuccess: () => {
        toast.success("Lease terminated.");
        setShowTerminate(false);
        router.push("/leases");
      },
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : "Failed to terminate lease.");
      },
    });
  }

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

  if (!lease) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Lease not found</h1>
        <Link href="/leases">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Leases
          </Button>
        </Link>
      </div>
    );
  }

  const propertyLabel = property
    ? `${property.address}, ${property.city}`
    : lease.propertyId;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link href="/leases">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Lease — {propertyLabel}
              </h1>
              <p className="text-muted-foreground">
                {tenant ? tenant.name : lease.tenantId}
              </p>
            </div>
            <LeaseStatusBadge
              status={lease.status as LeaseStatus}
              endDate={lease.endDate}
            />
          </div>
        </div>
        <div className="flex gap-2">
          {lease.status === LeaseStatus.PENDING && (
            <Button onClick={() => setShowActivate(true)}>
              Activate Lease
            </Button>
          )}
          {lease.status === LeaseStatus.ACTIVE && (
            <>
              <Button
                variant="outline"
                onClick={() => setShowTerminate(true)}
              >
                Terminate Lease
              </Button>
              <Link href={`/leases/${id}/renew`}>
                <Button variant="outline">Renew Lease</Button>
              </Link>
            </>
          )}
          {lease.status === LeaseStatus.EXPIRED && (
            <Link href={`/leases/${id}/renew`}>
              <Button variant="outline">Renew Lease</Button>
            </Link>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Lease Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-medium">Property</p>
                  {property ? (
                    <Link
                      href={`/properties/${property.id}`}
                      className="text-sm text-muted-foreground hover:underline"
                    >
                      {property.address}, {property.city}
                    </Link>
                  ) : (
                    <p className="text-sm text-muted-foreground">{lease.propertyId}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">Tenant</p>
                  {tenant ? (
                    <Link
                      href={`/tenants/${tenant.id}`}
                      className="text-sm text-muted-foreground hover:underline"
                    >
                      {tenant.name}
                    </Link>
                  ) : (
                    <p className="text-sm text-muted-foreground">{lease.tenantId}</p>
                  )}
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Lease Period</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(lease.startDate)} — {formatDate(lease.endDate)}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <DollarSign className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Monthly Rent</p>
                    <p className="text-sm text-muted-foreground">
                      {formatRent(lease.monthlyRent)}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium">Security Deposit</p>
                  <p className="text-sm text-muted-foreground">
                    {formatRent(lease.securityDeposit)}
                  </p>
                </div>
              </div>
              {lease.renewedFromLeaseId && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium">Renewed From</p>
                    <Link
                      href={`/leases/${lease.renewedFromLeaseId}`}
                      className="text-sm text-muted-foreground hover:underline"
                    >
                      View original lease
                    </Link>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Payment history coming in Sprint 4.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent>
              <LeaseStatusBadge
                status={lease.status as LeaseStatus}
                endDate={lease.endDate}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <ActivateLeaseDialog
        open={showActivate}
        onOpenChange={setShowActivate}
        onConfirm={handleActivate}
        isActivating={statusMutation.isPending}
      />

      <TerminateLeaseDialog
        open={showTerminate}
        onOpenChange={setShowTerminate}
        onConfirm={handleTerminate}
        isTerminating={statusMutation.isPending}
      />
    </div>
  );
}
