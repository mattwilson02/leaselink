"use client";

import { useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mail, Phone, Plus, User, Eye } from "lucide-react";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TenantStatusBadge } from "@/components/tenants/tenant-status-badge";
import { OnboardingProgress } from "@/components/tenants/onboarding-progress";
import { DocumentRequestStatusBadge } from "@/components/documents/document-request-status-badge";
import { PaymentStatusBadge } from "@/components/payments/payment-status-badge";
import { MaintenanceStatusBadge } from "@/components/maintenance/maintenance-status-badge";
import { MaintenancePriorityBadge } from "@/components/maintenance/maintenance-priority-badge";
import { LeaseStatusBadge } from "@/components/leases/lease-status-badge";
import { useTenant } from "@/hooks/use-tenants";
import { useLeases } from "@/hooks/use-leases";
import { useDocumentRequests } from "@/hooks/use-document-requests";
import { useDocuments } from "@/hooks/use-documents";
import { usePayments } from "@/hooks/use-payments";
import { useMaintenanceRequests } from "@/hooks/use-maintenance-requests";
import {
  TenantStatus,
  OnboardingStatus,
  DocumentRequestType,
  DOCUMENT_REQUEST_TYPE_LABELS,
  LeaseStatus,
  MaintenanceStatus,
  MaintenancePriority,
} from "@leaselink/shared";
import type { Payment } from "@leaselink/shared";

const TABS = ["overview", "lease", "payments", "documents", "maintenance"] as const;
type TabValue = (typeof TABS)[number];

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

export default function TenantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params.id as string;

  const rawTab = searchParams.get("tab") ?? "overview";
  const activeTab: TabValue = (TABS as readonly string[]).includes(rawTab)
    ? (rawTab as TabValue)
    : "overview";

  function handleTabChange(value: string | null) {
    if (!value) return;
    const sp = new URLSearchParams(searchParams.toString());
    sp.set("tab", value);
    router.replace(`?${sp.toString()}`, { scroll: false });
  }

  const { data, isLoading } = useTenant(id);
  const tenant = data?.data;

  const { data: leaseData, isLoading: leaseLoading } = useLeases({
    tenantId: id,
    status: "ACTIVE",
    pageSize: 1,
  });

  const { data: requestsData, isLoading: requestsLoading } =
    useDocumentRequests({ limit: 50 });

  const { data: documentsData, isLoading: documentsLoading } = useDocuments({ pageSize: 100 });

  const [paymentsPage, setPaymentsPage] = useState(1);
  const paymentsPageSize = 20;
  const { data: paymentsData, isLoading: paymentsLoading } = usePayments({
    tenantId: id,
    page: paymentsPage,
    pageSize: paymentsPageSize,
  });
  const payments = paymentsData?.data ?? [];
  const paymentsTotalCount = paymentsData?.meta?.totalCount ?? 0;
  const paymentsTotalPages = paymentsData?.meta?.totalPages ?? 1;

  const [maintenancePage, setMaintenancePage] = useState(1);
  const maintenancePageSize = 20;
  const { data: maintenanceData, isLoading: maintenanceLoading } =
    useMaintenanceRequests({ tenantId: id, page: maintenancePage, pageSize: maintenancePageSize });
  const allMaintenanceRequests = maintenanceData?.data ?? [];
  const maintenanceTotalCount = maintenanceData?.meta?.totalCount ?? 0;
  const maintenanceTotalPages = maintenanceData?.meta?.totalPages ?? 1;

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

  const tenantDocumentRequests = (requestsData?.documentRequests ?? []).filter(
    (r) => r.clientId === id
  );
  const tenantDocuments = documentsData?.data ?? [];
  const activeLease =
    leaseData?.data && leaseData.data.length > 0 ? leaseData.data[0] : null;

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

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList variant="line">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="lease">Lease</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-6 lg:grid-cols-3 pt-4">
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
                        <p className="text-sm text-muted-foreground">
                          {tenant.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Mail className="mt-0.5 h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Email</p>
                        <p className="text-sm text-muted-foreground">
                          {tenant.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Phone className="mt-0.5 h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Phone Number</p>
                        <p className="text-sm text-muted-foreground">
                          {tenant.phoneNumber}
                        </p>
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
                      {tenant.receivesNotificationsForMaintenance
                        ? "Enabled"
                        : "Disabled"}
                    </p>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <p className="text-sm">Document Notifications</p>
                    <p className="text-sm text-muted-foreground">
                      {tenant.receivesNotificationsForDocuments
                        ? "Enabled"
                        : "Disabled"}
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
                    <p className="text-sm font-medium mb-2">
                      Onboarding Progress
                    </p>
                    <OnboardingProgress
                      status={tenant.onboardingStatus as OnboardingStatus}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="lease">
          <div className="pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Active Lease</CardTitle>
              </CardHeader>
              <CardContent>
                {leaseLoading ? (
                  <Skeleton className="h-4 w-full" />
                ) : activeLease ? (
                  <div className="space-y-3">
                    <Link
                      href={`/leases/${activeLease.id}`}
                      className="block space-y-1 hover:bg-muted/50 rounded-md p-2 -m-2 transition-colors"
                    >
                      <p className="text-sm font-medium">
                        {new Date(activeLease.startDate).toLocaleDateString()} —{" "}
                        {new Date(activeLease.endDate).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        ${activeLease.monthlyRent.toLocaleString()}/mo
                      </p>
                    </Link>
                    <LeaseStatusBadge
                      status={activeLease.status as LeaseStatus}
                      endDate={activeLease.endDate}
                    />
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No active lease for this tenant.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="payments">
          <div className="pt-4 space-y-4">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Amount</TableHead>
                    <TableHead className="hidden sm:table-cell">
                      Due Date
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Paid At
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentsLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        {[1, 2, 3, 4, 5].map((j) => (
                          <TableCell key={j}>
                            <Skeleton className="h-4 w-24" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : payments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32 text-center">
                        <p className="text-muted-foreground">
                          No payments found for this tenant.
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    payments.map((payment: Payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">
                          {formatCurrency(payment.amount)}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {formatDate(payment.dueDate)}
                        </TableCell>
                        <TableCell>
                          <PaymentStatusBadge status={payment.status} />
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {payment.paidAt ? formatDate(payment.paidAt) : "\u2014"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/payments/${payment.id}`}>
                            <Button variant="ghost" size="icon">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            {paymentsTotalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing page {paymentsPage} of {paymentsTotalPages} (
                  {paymentsTotalCount}{" "}
                  {paymentsTotalCount === 1 ? "payment" : "payments"})
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={paymentsPage <= 1}
                    onClick={() => setPaymentsPage((p) => p - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={paymentsPage >= paymentsTotalPages}
                    onClick={() => setPaymentsPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="documents">
          <div className="pt-4 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Document Requests</CardTitle>
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
                ) : tenantDocumentRequests.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No document requests for this tenant.
                  </p>
                ) : (
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
                      {tenantDocumentRequests.map((request) => (
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
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Uploaded Documents</CardTitle>
              </CardHeader>
              <CardContent>
                {documentsLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ) : tenantDocuments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No documents uploaded yet.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead className="hidden sm:table-cell">
                          Folder
                        </TableHead>
                        <TableHead className="hidden md:table-cell">
                          Uploaded
                        </TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tenantDocuments.map((doc) => (
                        <TableRow key={doc.id}>
                          <TableCell className="font-medium">
                            {doc.name}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                            {doc.folder}
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                            {formatDate(doc.createdAt)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Link href={`/documents/${doc.id}`}>
                              <Button variant="ghost" size="icon">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="maintenance">
          <div className="pt-4 space-y-4">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Property
                    </TableHead>
                    <TableHead className="hidden sm:table-cell">
                      Category
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Created
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {maintenanceLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        {[1, 2, 3, 4, 5, 6].map((j) => (
                          <TableCell key={j}>
                            <Skeleton className="h-4 w-24" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : allMaintenanceRequests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center">
                        <p className="text-muted-foreground">
                          No maintenance requests found.
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    allMaintenanceRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium">
                          {request.title}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                          {request.propertyId ?? "\u2014"}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                          {request.category}
                        </TableCell>
                        <TableCell>
                          <MaintenanceStatusBadge
                            status={request.status as MaintenanceStatus}
                          />
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                          {formatDate(request.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/maintenance/${request.id}`}>
                            <Button variant="ghost" size="icon">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            {maintenanceTotalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing page {maintenancePage} of {maintenanceTotalPages} (
                  {maintenanceTotalCount}{" "}
                  {maintenanceTotalCount === 1 ? "request" : "requests"})
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={maintenancePage <= 1}
                    onClick={() => setMaintenancePage((p) => p - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={maintenancePage >= maintenanceTotalPages}
                    onClick={() => setMaintenancePage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
