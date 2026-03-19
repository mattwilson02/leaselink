"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, RefreshCw } from "lucide-react";
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
import { MaintenanceStatusBadge } from "@/components/maintenance/maintenance-status-badge";
import { MaintenancePriorityBadge } from "@/components/maintenance/maintenance-priority-badge";
import { UpdateStatusDialog } from "@/components/maintenance/update-status-dialog";
import {
  useMaintenanceRequests,
  useUpdateMaintenanceRequestStatus,
} from "@/hooks/use-maintenance-requests";
import { useProperties } from "@/hooks/use-properties";
import { useTenants } from "@/hooks/use-tenants";
import {
  MaintenanceStatus,
  MaintenancePriority,
  MaintenanceCategory,
  MAINTENANCE_STATUS_LABELS,
  MAINTENANCE_PRIORITY_LABELS,
  MAINTENANCE_CATEGORY_LABELS,
  MAINTENANCE_STATUS_TRANSITIONS,
} from "@leaselink/shared";
import type { MaintenanceRequest } from "@leaselink/shared";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const ALL = "ALL";

function formatRelativeTime(isoString: string): string {
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHr / 24);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? "" : "s"} ago`;
  if (diffHr < 24) return `${diffHr} hour${diffHr === 1 ? "" : "s"} ago`;
  if (diffDays < 30) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  const diffMonths = Math.floor(diffDays / 30);
  return `${diffMonths} month${diffMonths === 1 ? "" : "s"} ago`;
}

export default function MaintenancePage() {
  const [statusFilter, setStatusFilter] = useState<string>(ALL);
  const [priorityFilter, setPriorityFilter] = useState<string>(ALL);
  const [categoryFilter, setCategoryFilter] = useState<string>(ALL);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const [updateStatusId, setUpdateStatusId] = useState<string | null>(null);

  const filters = {
    ...(statusFilter !== ALL ? { status: statusFilter } : {}),
    ...(priorityFilter !== ALL ? { priority: priorityFilter } : {}),
    ...(categoryFilter !== ALL ? { category: categoryFilter } : {}),
    page,
    pageSize,
  };

  const { data: requestsData, isLoading } = useMaintenanceRequests(filters);
  const { data: propertiesData } = useProperties({ pageSize: 200 });
  const { data: tenantsData } = useTenants({ pageSize: 200 });

  const updateMutation = useUpdateMaintenanceRequestStatus(updateStatusId ?? "");

  const requests = requestsData?.data ?? [];
  const meta = requestsData?.meta;
  const totalPages = meta?.totalPages ?? 1;

  const propertiesById = Object.fromEntries(
    (propertiesData?.data ?? []).map((p) => [p.id, p])
  );
  const tenantsById = Object.fromEntries(
    (tenantsData?.data ?? []).map((t) => [t.id, t])
  );

  const activeRequest = requests.find((r) => r.id === updateStatusId);

  function handleStatusUpdate(newStatus: MaintenanceStatus) {
    if (!updateStatusId) return;
    updateMutation.mutate(newStatus, {
      onSuccess: () => {
        toast.success("Status updated.");
        setUpdateStatusId(null);
      },
      onError: (err) => {
        toast.error(
          err instanceof Error ? err.message : "Failed to update status."
        );
      },
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">
          Maintenance Requests
        </h1>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap">
        <Select
          value={statusFilter}
          onValueChange={(value) => {
            setStatusFilter(value ?? ALL);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All statuses</SelectItem>
            {Object.values(MaintenanceStatus).map((status) => (
              <SelectItem key={status} value={status}>
                {MAINTENANCE_STATUS_LABELS[status]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={priorityFilter}
          onValueChange={(value) => {
            setPriorityFilter(value ?? ALL);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Filter by priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All priorities</SelectItem>
            {Object.values(MaintenancePriority).map((priority) => (
              <SelectItem key={priority} value={priority}>
                {MAINTENANCE_PRIORITY_LABELS[priority]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={categoryFilter}
          onValueChange={(value) => {
            setCategoryFilter(value ?? ALL);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All categories</SelectItem>
            {Object.values(MaintenanceCategory).map((category) => (
              <SelectItem key={category} value={category}>
                {MAINTENANCE_CATEGORY_LABELS[category]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead className="hidden md:table-cell">Property</TableHead>
              <TableHead className="hidden lg:table-cell">Tenant</TableHead>
              <TableHead className="hidden lg:table-cell">Category</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden sm:table-cell">Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-40" />
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <Skeleton className="h-4 w-28" />
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-20" />
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-16 ml-auto" />
                  </TableCell>
                </TableRow>
              ))
            ) : requests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center">
                  <p className="text-muted-foreground">
                    No maintenance requests.
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              requests.map((request: MaintenanceRequest) => {
                const property = propertiesById[request.propertyId];
                const tenant = tenantsById[request.tenantId];
                const isEmergency =
                  request.priority === MaintenancePriority.EMERGENCY;

                return (
                  <TableRow
                    key={request.id}
                    className={cn(
                      isEmergency &&
                        "border-l-4 border-l-red-500 bg-red-50/50"
                    )}
                  >
                    <TableCell>
                      <Link
                        href={`/maintenance/${request.id}`}
                        className="font-medium hover:underline"
                      >
                        {request.title}
                      </Link>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {property ? (
                        <Link
                          href={`/properties/${property.id}`}
                          className="text-sm hover:underline"
                        >
                          {property.address}, {property.city}
                        </Link>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          {request.propertyId.slice(0, 8)}...
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {tenant ? (
                        <Link
                          href={`/tenants/${tenant.id}`}
                          className="text-sm hover:underline"
                        >
                          {tenant.name}
                        </Link>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          {request.tenantId.slice(0, 8)}...
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                      {MAINTENANCE_CATEGORY_LABELS[request.category as MaintenanceCategory]}
                    </TableCell>
                    <TableCell>
                      <MaintenancePriorityBadge
                        priority={request.priority as MaintenancePriority}
                      />
                    </TableCell>
                    <TableCell>
                      <MaintenanceStatusBadge
                        status={request.status as MaintenanceStatus}
                      />
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                      {formatRelativeTime(request.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Link href={`/maintenance/${request.id}`}>
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        {(MAINTENANCE_STATUS_TRANSITIONS[
                          request.status as MaintenanceStatus
                        ]?.length ?? 0) > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setUpdateStatusId(request.id)}
                          >
                            <RefreshCw className="mr-1 h-3 w-3" />
                            Status
                          </Button>
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
            {meta.totalCount === 1 ? "request" : "requests"})
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

      {activeRequest && (
        <UpdateStatusDialog
          open={!!updateStatusId}
          onOpenChange={(open) => !open && setUpdateStatusId(null)}
          currentStatus={activeRequest.status as MaintenanceStatus}
          onConfirm={handleStatusUpdate}
          isUpdating={updateMutation.isPending}
        />
      )}
    </div>
  );
}
