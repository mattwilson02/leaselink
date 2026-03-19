"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Search, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { TenantStatusBadge } from "@/components/tenants/tenant-status-badge";
import { OnboardingProgress } from "@/components/tenants/onboarding-progress";
import { useTenants, useDeleteTenant } from "@/hooks/use-tenants";
import {
  TenantStatus,
  OnboardingStatus,
  TENANT_STATUS_LABELS,
} from "@leaselink/shared";
import type { Tenant } from "@leaselink/shared";
import { toast } from "sonner";

const ALL_STATUSES = "ALL";

export default function TenantsPage() {
  const [statusFilter, setStatusFilter] = useState<string>(ALL_STATUSES);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const filters = {
    ...(statusFilter !== ALL_STATUSES ? { status: statusFilter } : {}),
    ...(search ? { search } : {}),
    page,
    pageSize,
  };

  const { data, isLoading } = useTenants(filters);
  const deleteMutation = useDeleteTenant();

  const tenants = data?.data ?? [];
  const meta = data?.meta;
  const totalPages = meta?.totalPages ?? 1;

  function handleDelete(tenant: Tenant) {
    if (!confirm(`Delete tenant "${tenant.name}"? This cannot be undone.`)) return;
    deleteMutation.mutate(tenant.id, {
      onSuccess: () => toast.success("Tenant deleted."),
      onError: (err) =>
        toast.error(err instanceof Error ? err.message : "Failed to delete tenant."),
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Tenants</h1>
        <Link href="/tenants/invite">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Invite Tenant
          </Button>
        </Link>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>
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
            {Object.values(TenantStatus).map((status) => (
              <SelectItem key={status} value={status}>
                {TENANT_STATUS_LABELS[status]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="hidden md:table-cell">Email</TableHead>
              <TableHead className="hidden lg:table-cell">Phone Number</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden sm:table-cell">Onboarding</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Skeleton className="h-4 w-40" />
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <Skeleton className="h-4 w-28" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-16" />
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-16 ml-auto" />
                  </TableCell>
                </TableRow>
              ))
            ) : tenants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  <p className="text-muted-foreground">
                    {search || statusFilter !== ALL_STATUSES
                      ? "No tenants match your filters."
                      : "No tenants yet. Invite your first tenant."}
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              tenants.map((tenant: Tenant) => (
                <TableRow key={tenant.id}>
                  <TableCell>
                    <Link
                      href={`/tenants/${tenant.id}`}
                      className="font-medium hover:underline"
                    >
                      {tenant.name}
                    </Link>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {tenant.email}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {tenant.phoneNumber}
                  </TableCell>
                  <TableCell>
                    <TenantStatusBadge
                      status={tenant.status as TenantStatus}
                    />
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <OnboardingProgress
                      status={tenant.onboardingStatus as OnboardingStatus}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/tenants/${tenant.id}`}>
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(tenant)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {meta && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing page {meta.page} of {totalPages} ({meta.totalCount}{" "}
            {meta.totalCount === 1 ? "tenant" : "tenants"})
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
    </div>
  );
}
