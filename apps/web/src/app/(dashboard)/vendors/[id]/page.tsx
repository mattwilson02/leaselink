"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit, Trash2, Mail, Phone, FileText, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
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
import { VendorSpecialtyBadge } from "@/components/vendors/vendor-specialty-badge";
import { MaintenanceStatusBadge } from "@/components/maintenance/maintenance-status-badge";
import { useVendor, useDeleteVendor } from "@/hooks/use-vendors";
import { useMaintenanceRequestsByVendor } from "@/hooks/use-maintenance-requests";
import { MAINTENANCE_CATEGORY_LABELS } from "@leaselink/shared";
import { toast } from "sonner";
import { useState } from "react";

function formatDate(isoString: string) {
  return new Date(isoString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function VendorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data, isLoading } = useVendor(id);
  const vendor = data?.data;

  const { data: assignedRequests, isLoading: isLoadingRequests } =
    useMaintenanceRequestsByVendor(id);

  const deleteMutation = useDeleteVendor();
  const [showDelete, setShowDelete] = useState(false);

  function handleDelete() {
    deleteMutation.mutate(id, {
      onSuccess: () => {
        toast.success("Vendor deleted.");
        router.push("/vendors");
      },
      onError: (err) => {
        toast.error(
          err instanceof Error ? err.message : "Failed to delete vendor."
        );
        setShowDelete(false);
      },
    });
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
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

  if (!vendor) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Vendor not found</h1>
        <Link href="/vendors">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Vendors
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link href="/vendors">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{vendor.name}</h1>
            <div className="mt-1">
              <VendorSpecialtyBadge specialty={vendor.specialty} />
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/vendors/${id}/edit`}>
            <Button variant="outline" size="sm">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDelete(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Vendor Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-start gap-3">
                  <Phone className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Phone</p>
                    <p className="text-sm text-muted-foreground">
                      {vendor.phone ?? "Not provided"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    {vendor.email ? (
                      <a
                        href={`mailto:${vendor.email}`}
                        className="text-sm text-muted-foreground hover:underline"
                      >
                        {vendor.email}
                      </a>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Not provided
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {vendor.notes && (
                <>
                  <Separator />
                  <div className="flex items-start gap-3">
                    <FileText className="mt-0.5 h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Notes</p>
                      <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">
                        {vendor.notes}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium">Specialty</p>
                <div className="mt-1">
                  <VendorSpecialtyBadge specialty={vendor.specialty} />
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium">Added</p>
                <p className="text-sm text-muted-foreground">
                  {formatDate(vendor.createdAt)}
                </p>
              </div>
              {vendor.updatedAt && (
                <div>
                  <p className="text-sm font-medium">Last Updated</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(vendor.updatedAt)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            Assigned Maintenance Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingRequests ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : !assignedRequests || assignedRequests.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No open or in-progress requests assigned to this vendor.
            </p>
          ) : (
            <div className="divide-y">
              {assignedRequests.map((req) => (
                <div
                  key={req.id}
                  className="flex items-center justify-between py-3"
                >
                  <div className="space-y-0.5">
                    <Link
                      href={`/maintenance/${req.id}`}
                      className="text-sm font-medium hover:underline"
                    >
                      {req.title}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {MAINTENANCE_CATEGORY_LABELS[req.category]} &middot;{" "}
                      {formatDate(req.createdAt)}
                    </p>
                  </div>
                  <MaintenanceStatusBadge status={req.status} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Vendor</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-medium">{vendor.name}</span>? This action
              cannot be undone. Vendors with open maintenance requests cannot be
              deleted.
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
