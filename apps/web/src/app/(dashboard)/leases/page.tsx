"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Eye } from "lucide-react";
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
import { LeaseStatusBadge } from "@/components/leases/lease-status-badge";
import { ActivateLeaseDialog } from "@/components/leases/activate-lease-dialog";
import { TerminateLeaseDialog } from "@/components/leases/terminate-lease-dialog";
import { useLeases, useUpdateLeaseStatus } from "@/hooks/use-leases";
import { useProperties } from "@/hooks/use-properties";
import { useTenants } from "@/hooks/use-tenants";
import { LeaseStatus, LEASE_STATUS_LABELS } from "@leaselink/shared";
import type { Lease } from "@leaselink/shared";
import { toast } from "sonner";

const ALL_STATUSES = "ALL";

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

export default function LeasesPage() {
  const [statusFilter, setStatusFilter] = useState<string>(ALL_STATUSES);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const [activateLeaseId, setActivateLeaseId] = useState<string | null>(null);
  const [terminateLeaseId, setTerminateLeaseId] = useState<string | null>(null);

  const filters = {
    ...(statusFilter !== ALL_STATUSES ? { status: statusFilter } : {}),
    page,
    pageSize,
  };

  const { data: leasesData, isLoading: leasesLoading } = useLeases(filters);
  const { data: propertiesData } = useProperties({ pageSize: 200 });
  const { data: tenantsData } = useTenants({ pageSize: 200 });

  const activateMutation = useUpdateLeaseStatus(activateLeaseId ?? "");
  const terminateMutation = useUpdateLeaseStatus(terminateLeaseId ?? "");

  const leases = leasesData?.data ?? [];
  const meta = leasesData?.meta;
  const totalPages = meta?.totalPages ?? 1;

  const propertiesById = Object.fromEntries(
    (propertiesData?.data ?? []).map((p) => [p.id, p])
  );
  const tenantsById = Object.fromEntries(
    (tenantsData?.data ?? []).map((t) => [t.id, t])
  );

  function handleActivate() {
    if (!activateLeaseId) return;
    activateMutation.mutate(LeaseStatus.ACTIVE, {
      onSuccess: () => {
        toast.success("Lease activated.");
        setActivateLeaseId(null);
      },
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : "Failed to activate lease.");
      },
    });
  }

  function handleTerminate() {
    if (!terminateLeaseId) return;
    terminateMutation.mutate(LeaseStatus.TERMINATED, {
      onSuccess: () => {
        toast.success("Lease terminated.");
        setTerminateLeaseId(null);
      },
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : "Failed to terminate lease.");
      },
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Leases</h1>
        <Link href="/leases/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Lease
          </Button>
        </Link>
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
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_STATUSES}>All statuses</SelectItem>
            {Object.values(LeaseStatus).map((status) => (
              <SelectItem key={status} value={status}>
                {LEASE_STATUS_LABELS[status]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Property</TableHead>
              <TableHead className="hidden md:table-cell">Tenant</TableHead>
              <TableHead className="hidden lg:table-cell">Start Date</TableHead>
              <TableHead className="hidden lg:table-cell">End Date</TableHead>
              <TableHead className="hidden sm:table-cell">Rent</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leasesLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-40" />
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20 ml-auto" />
                  </TableCell>
                </TableRow>
              ))
            ) : leases.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center">
                  <p className="text-muted-foreground">
                    {statusFilter !== ALL_STATUSES
                      ? "No leases match your filters."
                      : "No leases yet. Create your first lease."}
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              leases.map((lease: Lease) => {
                const property = propertiesById[lease.propertyId];
                const tenant = tenantsById[lease.tenantId];
                return (
                  <TableRow key={lease.id}>
                    <TableCell>
                      <Link
                        href={`/leases/${lease.id}`}
                        className="font-medium hover:underline"
                      >
                        {property
                          ? `${property.address}, ${property.city}`
                          : lease.propertyId.slice(0, 8) + "..."}
                      </Link>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {tenant ? tenant.name : lease.tenantId.slice(0, 8) + "..."}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {formatDate(lease.startDate)}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {formatDate(lease.endDate)}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {formatRent(lease.monthlyRent)}
                    </TableCell>
                    <TableCell>
                      <LeaseStatusBadge
                        status={lease.status as LeaseStatus}
                        endDate={lease.endDate}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Link href={`/leases/${lease.id}`}>
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        {lease.status === LeaseStatus.PENDING && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setActivateLeaseId(lease.id)}
                          >
                            Activate
                          </Button>
                        )}
                        {lease.status === LeaseStatus.ACTIVE && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setTerminateLeaseId(lease.id)}
                          >
                            Terminate
                          </Button>
                        )}
                        {(lease.status === LeaseStatus.ACTIVE ||
                          lease.status === LeaseStatus.EXPIRED) && (
                          <Link href={`/leases/${lease.id}/renew`}>
                            <Button variant="outline" size="sm">
                              Renew
                            </Button>
                          </Link>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {meta && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing page {meta.page} of {totalPages} ({meta.totalCount}{" "}
            {meta.totalCount === 1 ? "lease" : "leases"})
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

      <ActivateLeaseDialog
        open={!!activateLeaseId}
        onOpenChange={(open) => !open && setActivateLeaseId(null)}
        onConfirm={handleActivate}
        isActivating={activateMutation.isPending}
      />

      <TerminateLeaseDialog
        open={!!terminateLeaseId}
        onOpenChange={(open) => !open && setTerminateLeaseId(null)}
        onConfirm={handleTerminate}
        isTerminating={terminateMutation.isPending}
      />
    </div>
  );
}
