"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Edit,
  Trash2,
  RefreshCw,
  MapPin,
  Home,
  DollarSign,
  Ruler,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { PropertyStatusBadge } from "@/components/properties/property-status-badge";
import { DeletePropertyDialog } from "@/components/properties/delete-property-dialog";
import { ChangeStatusDialog } from "@/components/properties/change-status-dialog";
import { PropertyPhotoGallery } from "@/components/properties/property-photo-gallery";
import {
  useProperty,
  useDeleteProperty,
  useUpdatePropertyStatus,
} from "@/hooks/use-properties";
import { useActiveLeaseByProperty } from "@/hooks/use-leases";
import { useTenant } from "@/hooks/use-tenants";
import { useMaintenanceRequestsByProperty } from "@/hooks/use-maintenance-requests";
import { MaintenanceStatusBadge } from "@/components/maintenance/maintenance-status-badge";
import { MaintenancePriorityBadge } from "@/components/maintenance/maintenance-priority-badge";
import { LeaseStatusBadge } from "@/components/leases/lease-status-badge";
import { TenantStatusBadge } from "@/components/tenants/tenant-status-badge";
import {
  PropertyStatus,
  PROPERTY_TYPE_LABELS,
  LeaseStatus,
  TenantStatus,
  MaintenanceStatus,
  MaintenancePriority,
} from "@leaselink/shared";
import type { PropertyType } from "@leaselink/shared";
import { toast } from "sonner";

export default function PropertyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data, isLoading } = useProperty(id);
  const deleteMutation = useDeleteProperty();
  const statusMutation = useUpdatePropertyStatus(id);

  const { data: activeLeaseData } = useActiveLeaseByProperty(id);
  const activeLease = activeLeaseData?.data;
  const { data: activeTenantData } = useTenant(activeLease?.tenantId ?? "");
  const { data: maintenanceData } = useMaintenanceRequestsByProperty(id, {
    pageSize: 5,
  });

  const [showDelete, setShowDelete] = useState(false);
  const [showStatusChange, setShowStatusChange] = useState(false);

  const property = data?.property;

  function handleDelete() {
    deleteMutation.mutate(id, {
      onSuccess: () => {
        toast.success("Property deleted.");
        router.push("/properties");
      },
      onError: (err) => {
        toast.error(
          err instanceof Error ? err.message : "Failed to delete property."
        );
      },
    });
  }

  function handleStatusChange(newStatus: PropertyStatus) {
    statusMutation.mutate(newStatus, {
      onSuccess: () => {
        toast.success("Status updated.");
        setShowStatusChange(false);
      },
      onError: (err) => {
        toast.error(
          err instanceof Error ? err.message : "Failed to update status."
        );
      },
    });
  }

  function formatRent(amount: number) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount);
  }

  function formatDate(isoString: string) {
    return new Date(isoString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function isExpiringWithin60Days(endDate: string) {
    const now = new Date();
    const end = new Date(endDate);
    const days = Math.floor((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return days <= 60;
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

  if (!property) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">
          Property not found
        </h1>
        <Link href="/properties">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Properties
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link href="/properties">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {property.address}
            </h1>
            <p className="text-muted-foreground">
              {property.city}, {property.state} {property.zipCode}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowStatusChange(true)}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Change Status
          </Button>
          <Link href={`/properties/${id}/edit`}>
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
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Property Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Location</p>
                    <p className="text-sm text-muted-foreground">
                      {property.address}
                      <br />
                      {property.city}, {property.state} {property.zipCode}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Home className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Type</p>
                    <p className="text-sm text-muted-foreground">
                      {PROPERTY_TYPE_LABELS[property.propertyType as PropertyType]}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <DollarSign className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Monthly Rent</p>
                    <p className="text-sm text-muted-foreground">
                      {formatRent(property.rentAmount)}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Ruler className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Size</p>
                    <p className="text-sm text-muted-foreground">
                      {property.bedrooms} bed / {property.bathrooms} bath
                      {property.sqft ? ` / ${property.sqft.toLocaleString()} sqft` : ""}
                    </p>
                  </div>
                </div>
              </div>
              {property.description && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium">Description</p>
                    <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">
                      {property.description}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <PropertyPhotoGallery
                propertyId={property.id}
                photos={property.photos || []}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent>
              <PropertyStatusBadge
                status={property.status as PropertyStatus}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Current Tenant</CardTitle>
              <CardDescription>Tenant and lease information</CardDescription>
            </CardHeader>
            <CardContent>
              {activeTenantData?.data ? (
                <div className="space-y-2">
                  <Link
                    href={`/tenants/${activeTenantData.data.id}`}
                    className="font-medium hover:underline"
                  >
                    {activeTenantData.data.name}
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    {activeTenantData.data.email}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {activeTenantData.data.phoneNumber}
                  </p>
                  <TenantStatusBadge
                    status={activeTenantData.data.status as TenantStatus}
                  />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No active tenant assigned.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Active Lease</CardTitle>
            </CardHeader>
            <CardContent>
              {activeLease ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {formatDate(activeLease.startDate)} — {formatDate(activeLease.endDate)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Rent: {formatRent(activeLease.monthlyRent)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Deposit: {formatRent(activeLease.securityDeposit)}
                  </p>
                  {isExpiringWithin60Days(activeLease.endDate) && (
                    <p className="text-sm text-yellow-600 font-medium">
                      Expiring soon
                    </p>
                  )}
                  <LeaseStatusBadge
                    status={activeLease.status as LeaseStatus}
                    endDate={activeLease.endDate}
                  />
                  <div className="pt-1">
                    <Link
                      href={`/leases/${activeLease.id}`}
                      className="text-sm hover:underline"
                    >
                      View lease details
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    No active lease for this property.
                  </p>
                  <Link href={`/leases/new?propertyId=${id}`}>
                    <Button variant="outline" size="sm">
                      Create Lease
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Maintenance Requests</CardTitle>
                <Link
                  href={`/maintenance?propertyId=${id}`}
                  className="text-sm text-muted-foreground hover:underline"
                >
                  View all
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {!maintenanceData?.maintenanceRequests || maintenanceData.maintenanceRequests.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No maintenance requests for this property.
                </p>
              ) : (
                <div className="space-y-3">
                  {maintenanceData.maintenanceRequests.map((request) => (
                    <Link
                      key={request.id}
                      href={`/maintenance/${request.id}`}
                      className="flex items-start justify-between gap-2 rounded-md p-2 hover:bg-muted transition-colors"
                    >
                      <div className="min-w-0 space-y-1">
                        <p className="text-sm font-medium truncate">
                          {request.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(request.createdAt).toLocaleDateString(
                            "en-US",
                            { month: "short", day: "numeric", year: "numeric" }
                          )}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <MaintenancePriorityBadge
                          priority={request.priority as MaintenancePriority}
                        />
                        <MaintenanceStatusBadge
                          status={request.status as MaintenanceStatus}
                        />
                      </div>
                    </Link>
                  ))}
                  {(maintenanceData.totalCount ?? 0) > 5 && (
                    <div className="pt-1">
                      <Link
                        href={`/maintenance?propertyId=${id}`}
                        className="text-sm hover:underline"
                      >
                        View all {maintenanceData.totalCount} requests
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <DeletePropertyDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        onConfirm={handleDelete}
        propertyAddress={property.address}
        isDeleting={deleteMutation.isPending}
      />

      <ChangeStatusDialog
        open={showStatusChange}
        onOpenChange={setShowStatusChange}
        currentStatus={property.status as PropertyStatus}
        onConfirm={handleStatusChange}
        isUpdating={statusMutation.isPending}
      />
    </div>
  );
}
