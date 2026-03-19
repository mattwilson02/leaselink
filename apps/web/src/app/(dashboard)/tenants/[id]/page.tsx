"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mail, Phone, Plus, User } from "lucide-react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TenantStatusBadge } from "@/components/tenants/tenant-status-badge";
import { OnboardingProgress } from "@/components/tenants/onboarding-progress";
import { DocumentRequestStatusBadge } from "@/components/documents/document-request-status-badge";
import { useTenant } from "@/hooks/use-tenants";
import { useDocumentRequests } from "@/hooks/use-document-requests";
import {
  TenantStatus,
  OnboardingStatus,
  DocumentRequestType,
  DOCUMENT_REQUEST_TYPE_LABELS,
} from "@leaselink/shared";

export default function TenantDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const { data, isLoading } = useTenant(id);
  const tenant = data?.data;

  const { data: requestsData, isLoading: requestsLoading } =
    useDocumentRequests({ limit: 50 });

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

  if (!tenant) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Tenant not found</h1>
        <Link href="/tenants">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tenants
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/tenants">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{tenant.name}</h1>
            <p className="text-muted-foreground">{tenant.email}</p>
          </div>
          <TenantStatusBadge status={tenant.status as TenantStatus} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-start gap-3">
                  <User className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Name</p>
                    <p className="text-sm text-muted-foreground">{tenant.name}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">{tenant.email}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Phone Number</p>
                    <p className="text-sm text-muted-foreground">{tenant.phoneNumber}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm">Email Notifications</p>
                <p className="text-sm text-muted-foreground">
                  {tenant.receivesEmailNotifications ? "Enabled" : "Disabled"}
                </p>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <p className="text-sm">Push Notifications</p>
                <p className="text-sm text-muted-foreground">
                  {tenant.receivesPushNotifications ? "Enabled" : "Disabled"}
                </p>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <p className="text-sm">Maintenance Notifications</p>
                <p className="text-sm text-muted-foreground">
                  {tenant.receivesNotificationsForMaintenance ? "Enabled" : "Disabled"}
                </p>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <p className="text-sm">Document Notifications</p>
                <p className="text-sm text-muted-foreground">
                  {tenant.receivesNotificationsForDocuments ? "Enabled" : "Disabled"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium mb-1">Account Status</p>
                <TenantStatusBadge status={tenant.status as TenantStatus} />
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium mb-2">Onboarding Progress</p>
                <OnboardingProgress
                  status={tenant.onboardingStatus as OnboardingStatus}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Active Lease</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">No active lease.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Documents</CardTitle>
                <Link href={`/documents/requests/new?tenantId=${id}`}>
                  <Button variant="outline" size="sm">
                    <Plus className="mr-1 h-3 w-3" />
                    Request
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {requestsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ) : (() => {
                const tenantRequests = (
                  requestsData?.documentRequests ?? []
                ).filter((r) => r.clientId === id);

                if (tenantRequests.length === 0) {
                  return (
                    <p className="text-sm text-muted-foreground">
                      No document requests for this tenant.
                    </p>
                  );
                }

                return (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Request Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="hidden sm:table-cell">
                          Created
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tenantRequests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell className="text-sm">
                            {DOCUMENT_REQUEST_TYPE_LABELS[
                              request.requestType as DocumentRequestType
                            ] ?? request.requestType}
                          </TableCell>
                          <TableCell>
                            <DocumentRequestStatusBadge
                              status={request.status}
                            />
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                            {new Date(request.createdAt).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              }
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                );
              })()}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
