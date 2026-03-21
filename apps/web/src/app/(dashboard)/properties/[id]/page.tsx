"use client";

import { useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
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
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
import { useMaintenanceRequests } from "@/hooks/use-maintenance-requests";
import { useExpenses } from "@/hooks/use-expenses";
import { useDocuments } from "@/hooks/use-documents";
import { MaintenanceStatusBadge } from "@/components/maintenance/maintenance-status-badge";
import { MaintenancePriorityBadge } from "@/components/maintenance/maintenance-priority-badge";
import { LeaseStatusBadge } from "@/components/leases/lease-status-badge";
import { TenantStatusBadge } from "@/components/tenants/tenant-status-badge";
import { ExpenseCategoryBadge } from "@/components/expenses/expense-category-badge";
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

const TABS = ["overview", "tenant-lease", "maintenance", "expenses", "documents"] as const;
type TabValue = (typeof TABS)[number];

export default function PropertyDetailPage() {
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

  const { data, isLoading } = useProperty(id);
  const deleteMutation = useDeleteProperty();
  const statusMutation = useUpdatePropertyStatus(id);

  const { data: activeLeaseData } = useActiveLeaseByProperty(id);
  const activeLease = activeLeaseData?.data;
  const { data: activeTenantData } = useTenant(activeLease?.tenantId ?? "");

  const [maintenancePage, setMaintenancePage] = useState(1);
  const maintenancePageSize = 20;
  const { data: maintenanceData, isLoading: maintenanceLoading } =
    useMaintenanceRequests({ propertyId: id, page: maintenancePage, pageSize: maintenancePageSize });
  const maintenanceRequests = maintenanceData?.maintenanceRequests ?? [];
  const maintenanceTotalCount = maintenanceData?.totalCount ?? 0;
  const maintenanceTotalPages = Math.ceil(maintenanceTotalCount / maintenancePageSize) || 1;

  const [expensesPage, setExpensesPage] = useState(1);
  const expensesPageSize = 20;
  const { data: expensesData, isLoading: expensesLoading } = useExpenses({
    propertyId: id,
    page: expensesPage,
    pageSize: expensesPageSize,
  });
  const expenses = expensesData?.data ?? [];
  const expensesTotalCount = expensesData?.meta?.totalCount ?? 0;
  const expensesTotalPages = expensesData?.meta?.totalPages ?? 1;

  const { data: documentsData, isLoading: documentsLoading } = useDocuments({ limit: 200 });
  const documents = (documentsData?.documents ?? []).filter(
    (doc) => doc.clientId === activeLease?.tenantId
  );

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

  function isExpiringWithin60Days(endDate: string) {
    const now = new Date();
    const end = new Date(endDate);
    const days = Math.floor(
      (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
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
        <div className="flex flex-wrap gap-2">
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

      <div className="flex items-center justify-end">
        <Link
          href={`/settings/audit-log?resourceType=PROPERTY&resourceId=${id}`}
          className="text-xs text-muted-foreground hover:underline"
        >
          View Audit Trail
        </Link>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList variant="line">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tenant-lease">Tenant &amp; Lease</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-6 lg:grid-cols-3 pt-4">
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
                          {
                            PROPERTY_TYPE_LABELS[
                              property.propertyType as PropertyType
                            ]
                          }
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
                          {property.sqft
                            ? ` / ${property.sqft.toLocaleString()} sqft`
                            : ""}
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
            </div>
          </div>
        </TabsContent>

        <TabsContent value="tenant-lease">
          <div className="grid gap-6 lg:grid-cols-2 pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Current Tenant</CardTitle>
                <CardDescription>Tenant information</CardDescription>
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
                      {formatDate(activeLease.startDate)} —{" "}
                      {formatDate(activeLease.endDate)}
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
          </div>
        </TabsContent>

        <TabsContent value="maintenance">
          <div className="pt-4 space-y-4">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead className="hidden sm:table-cell">
                      Category
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Created
                    </TableHead>
                    <TableHead className="hidden sm:table-cell">
                      Priority
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
                  ) : maintenanceRequests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center">
                        <p className="text-muted-foreground">
                          No maintenance requests for this property.
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    maintenanceRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium">
                          {request.title}
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
                        <TableCell className="hidden sm:table-cell">
                          <MaintenancePriorityBadge
                            priority={request.priority as MaintenancePriority}
                          />
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

        <TabsContent value="expenses">
          <div className="pt-4 space-y-4">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead className="hidden sm:table-cell">
                      Description
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expensesLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        {[1, 2, 3, 4, 5].map((j) => (
                          <TableCell key={j}>
                            <Skeleton className="h-4 w-24" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : expenses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32 text-center">
                        <p className="text-muted-foreground">
                          No expenses recorded for this property.
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    expenses.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell className="whitespace-nowrap">
                          {formatDate(expense.expenseDate)}
                        </TableCell>
                        <TableCell>
                          <ExpenseCategoryBadge category={expense.category} />
                        </TableCell>
                        <TableCell className="font-medium whitespace-nowrap">
                          {formatCurrency(expense.amount)}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell max-w-[200px] truncate">
                          {expense.description}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/expenses/${expense.id}`}>
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
            {expensesTotalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing page {expensesPage} of {expensesTotalPages} (
                  {expensesTotalCount}{" "}
                  {expensesTotalCount === 1 ? "expense" : "expenses"})
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={expensesPage <= 1}
                    onClick={() => setExpensesPage((p) => p - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={expensesPage >= expensesTotalPages}
                    onClick={() => setExpensesPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="documents">
          <div className="pt-4">
            <div className="rounded-md border">
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
                  {documentsLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i}>
                        {[1, 2, 3, 4].map((j) => (
                          <TableCell key={j}>
                            <Skeleton className="h-4 w-24" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : documents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-32 text-center">
                        <p className="text-muted-foreground">
                          No documents found.
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    documents.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium">{doc.name}</TableCell>
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
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

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
