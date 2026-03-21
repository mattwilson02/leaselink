"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, Edit, Trash2, Plus } from "lucide-react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { VendorSpecialtyBadge } from "@/components/vendors/vendor-specialty-badge";
import { useVendors, useDeleteVendor } from "@/hooks/use-vendors";
import {
  MaintenanceCategory,
  MAINTENANCE_CATEGORY_LABELS,
} from "@leaselink/shared";
import type { Vendor } from "@leaselink/shared";
import { toast } from "sonner";

const ALL = "ALL";

export default function VendorsPage() {
  const [specialtyFilter, setSpecialtyFilter] = useState<string>(ALL);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const pageSize = 20;

  const filters = {
    ...(specialtyFilter !== ALL ? { specialty: specialtyFilter } : {}),
    ...(search.trim() ? { search: search.trim() } : {}),
    page,
    pageSize,
  };

  const { data, isLoading } = useVendors(filters);
  const vendors = data?.data ?? [];
  const totalCount = data?.meta?.totalCount ?? 0;
  const totalPages = data?.meta?.totalPages ?? 1;

  const deleteMutation = useDeleteVendor();

  function handleDelete() {
    if (!deleteId) return;
    deleteMutation.mutate(deleteId, {
      onSuccess: () => {
        toast.success("Vendor deleted.");
        setDeleteId(null);
      },
      onError: (err) => {
        toast.error(
          err instanceof Error ? err.message : "Failed to delete vendor."
        );
        setDeleteId(null);
      },
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Vendors</h1>
        <Link href="/vendors/new">
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Vendor
          </Button>
        </Link>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap">
        <Select
          value={specialtyFilter}
          onValueChange={(value) => {
            setSpecialtyFilter(value ?? ALL);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-52">
            <SelectValue placeholder="All specialties">
              {(value: string) =>
                value === ALL
                  ? "All specialties"
                  : MAINTENANCE_CATEGORY_LABELS[value as MaintenanceCategory] ??
                    value
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All specialties</SelectItem>
            {Object.values(MaintenanceCategory).map((cat) => (
              <SelectItem key={cat} value={cat}>
                {MAINTENANCE_CATEGORY_LABELS[cat]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          placeholder="Search vendors..."
          className="w-full sm:w-64"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Specialty</TableHead>
              <TableHead className="hidden sm:table-cell">Phone</TableHead>
              <TableHead className="hidden md:table-cell">Email</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {[1, 2, 3, 4, 5].map((j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : vendors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center">
                  <p className="text-muted-foreground">No vendors found.</p>
                </TableCell>
              </TableRow>
            ) : (
              vendors.map((vendor: Vendor) => (
                <TableRow key={vendor.id}>
                  <TableCell className="font-medium">{vendor.name}</TableCell>
                  <TableCell>
                    <VendorSpecialtyBadge specialty={vendor.specialty} />
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                    {vendor.phone ?? "—"}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground max-w-[200px] truncate">
                    {vendor.email ?? "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/vendors/${vendor.id}`}>
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href={`/vendors/${vendor.id}/edit`}>
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(vendor.id)}
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

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing page {page} of {totalPages} ({totalCount}{" "}
            {totalCount === 1 ? "vendor" : "vendors"})
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

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => {
          if (!open) setDeleteId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Vendor</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this vendor? This action cannot be
              undone. Vendors with open maintenance requests cannot be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
