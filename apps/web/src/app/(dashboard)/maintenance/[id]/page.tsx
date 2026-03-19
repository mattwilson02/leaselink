"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { MaintenanceStatusBadge } from "@/components/maintenance/maintenance-status-badge";
import { MaintenancePriorityBadge } from "@/components/maintenance/maintenance-priority-badge";
import { UpdateStatusDialog } from "@/components/maintenance/update-status-dialog";
import { MaintenancePhotoViewer } from "@/components/maintenance/maintenance-photo-viewer";
import {
  useMaintenanceRequest,
  useUpdateMaintenanceRequestStatus,
} from "@/hooks/use-maintenance-requests";
import { useProperty } from "@/hooks/use-properties";
import { useTenant } from "@/hooks/use-tenants";
import {
  MaintenanceStatus,
  MaintenancePriority,
  MaintenanceCategory,
  MAINTENANCE_STATUS_LABELS,
  MAINTENANCE_CATEGORY_LABELS,
  MAINTENANCE_STATUS_TRANSITIONS,
} from "@leaselink/shared";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function formatDate(isoString: string) {
  return new Date(isoString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(isoString: string) {
  return new Date(isoString).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const STATUS_STEPS: MaintenanceStatus[] = [
  MaintenanceStatus.OPEN,
  MaintenanceStatus.IN_PROGRESS,
  MaintenanceStatus.RESOLVED,
  MaintenanceStatus.CLOSED,
];

interface StatusTimelineProps {
  currentStatus: MaintenanceStatus;
}

function StatusTimeline({ currentStatus }: StatusTimelineProps) {
  const currentIndex = STATUS_STEPS.indexOf(currentStatus);

  return (
    <div className="flex items-center gap-0">
      {STATUS_STEPS.map((step, index) => {
        const isComplete = index <= currentIndex;
        const isLast = index === STATUS_STEPS.length - 1;

        return (
          <div key={step} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  "h-3 w-3 rounded-full border-2 transition-colors",
                  isComplete
                    ? "bg-primary border-primary"
                    : "bg-muted border-muted-foreground/30"
                )}
              />
              <span
                className={cn(
                  "text-xs whitespace-nowrap",
                  isComplete
                    ? "text-foreground font-medium"
                    : "text-muted-foreground"
                )}
              >
                {MAINTENANCE_STATUS_LABELS[step]}
              </span>
            </div>
            {!isLast && (
              <div
                className={cn(
                  "h-0.5 w-12 sm:w-20 mb-4 mx-1 transition-colors",
                  index < currentIndex ? "bg-primary" : "bg-muted-foreground/20"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function MaintenanceDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const { data: requestData, isLoading } = useMaintenanceRequest(id);
  const request = requestData?.data;

  const { data: propertyData } = useProperty(request?.propertyId ?? "");
  const { data: tenantData } = useTenant(request?.tenantId ?? "");

  const property = propertyData?.data;
  const tenant = tenantData?.data;

  const [showUpdateStatus, setShowUpdateStatus] = useState(false);
  const statusMutation = useUpdateMaintenanceRequestStatus(id);

  function handleStatusUpdate(newStatus: MaintenanceStatus) {
    statusMutation.mutate(newStatus, {
      onSuccess: () => {
        toast.success("Status updated.");
        setShowUpdateStatus(false);
      },
      onError: (err) => {
        toast.error(
          err instanceof Error ? err.message : "Failed to update status."
        );
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

  if (!request) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">
          Request not found
        </h1>
        <Link href="/maintenance">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Maintenance
          </Button>
        </Link>
      </div>
    );
  }

  const hasValidTransitions =
    (MAINTENANCE_STATUS_TRANSITIONS[request.status as MaintenanceStatus]
      ?.length ?? 0) > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Link href="/maintenance">
            <Button variant="ghost" size="icon" className="mt-1">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">
              {request.title}
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              <MaintenanceStatusBadge
                status={request.status as MaintenanceStatus}
              />
              <MaintenancePriorityBadge
                priority={request.priority as MaintenancePriority}
              />
              <span className="text-sm text-muted-foreground">
                {MAINTENANCE_CATEGORY_LABELS[request.category as MaintenanceCategory]}
              </span>
            </div>
          </div>
        </div>
        {hasValidTransitions && (
          <Button onClick={() => setShowUpdateStatus(true)}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Update Status
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {request.description}
              </p>
            </CardContent>
          </Card>

          {request.photos && request.photos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>
                  Photos ({request.photos.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <MaintenancePhotoViewer photos={request.photos} />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Status Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <StatusTimeline
                  currentStatus={request.status as MaintenanceStatus}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                  <p className="text-sm text-muted-foreground">
                    {request.propertyId}
                  </p>
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
                  <p className="text-sm text-muted-foreground">
                    {request.tenantId}
                  </p>
                )}
              </div>

              <Separator />

              <div>
                <p className="text-sm font-medium">Created</p>
                <p className="text-sm text-muted-foreground">
                  {formatDateTime(request.createdAt)}
                </p>
              </div>

              {request.resolvedAt && (
                <div>
                  <p className="text-sm font-medium">Resolved</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(request.resolvedAt)}
                  </p>
                </div>
              )}

              {request.updatedAt && (
                <div>
                  <p className="text-sm font-medium">Last Updated</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDateTime(request.updatedAt)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent>
              <MaintenanceStatusBadge
                status={request.status as MaintenanceStatus}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <UpdateStatusDialog
        open={showUpdateStatus}
        onOpenChange={setShowUpdateStatus}
        currentStatus={request.status as MaintenanceStatus}
        onConfirm={handleStatusUpdate}
        isUpdating={statusMutation.isPending}
      />
    </div>
  );
}
