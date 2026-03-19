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
import { FolderOverview } from "@/components/documents/folder-overview";
import { DocumentRequestStatusBadge } from "@/components/documents/document-request-status-badge";
import { useFolderSummary } from "@/hooks/use-documents";
import { useDocumentRequests } from "@/hooks/use-document-requests";
import { useTenants } from "@/hooks/use-tenants";
import {
  DocumentRequestType,
  DocumentRequestStatus,
  DOCUMENT_REQUEST_TYPE_LABELS,
  DOCUMENT_REQUEST_STATUS_LABELS,
} from "@leaselink/shared";

const ALL = "ALL";
const PAGE_SIZE = 20;

function formatDate(isoString: string) {
  return new Date(isoString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function DocumentsPage() {
  const [requestTypeFilter, setRequestTypeFilter] = useState<string>(ALL);
  const [statusFilter, setStatusFilter] = useState<string>(ALL);
  const [page, setPage] = useState(1);

  const offset = (page - 1) * PAGE_SIZE;

  const { data: folderData, isLoading: folderLoading } = useFolderSummary();
  const { data: requestsData, isLoading: requestsLoading } = useDocumentRequests({
    offset,
    limit: PAGE_SIZE,
    ...(requestTypeFilter !== ALL ? { requestType: requestTypeFilter } : {}),
  });
  const { data: tenantsData } = useTenants({ pageSize: 200 });

  const folderItems = folderData?.documentsByFolder ?? [];
  const allRequests = requestsData?.documentRequests ?? [];

  // Client-side status filter
  const requests =
    statusFilter !== ALL
      ? allRequests.filter((r) => r.status === statusFilter)
      : allRequests;

  const tenantsById = Object.fromEntries(
    (tenantsData?.data ?? []).map((t) => [t.id, t])
  );

  const hasMore = allRequests.length === PAGE_SIZE;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Documents</h1>
        <Link href="/documents/requests/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Request
          </Button>
        </Link>
      </div>

      <div>
        <h2 className="text-sm font-medium text-muted-foreground mb-3">
          Documents by Folder
        </h2>
        <FolderOverview items={folderItems} isLoading={folderLoading} />
      </div>

      <div>
        <h2 className="text-base font-semibold mb-4">Document Requests</h2>

        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap mb-4">
          <Select
            value={requestTypeFilter}
            onValueChange={(value) => {
              setRequestTypeFilter(value ?? ALL);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-52">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All types</SelectItem>
              {Object.values(DocumentRequestType).map((type) => (
                <SelectItem key={type} value={type}>
                  {DOCUMENT_REQUEST_TYPE_LABELS[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

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
              {Object.values(DocumentRequestStatus).map((status) => (
                <SelectItem key={status} value={status}>
                  {DOCUMENT_REQUEST_STATUS_LABELS[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tenant</TableHead>
                <TableHead>Request Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden sm:table-cell">Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requestsLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-36" />
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
                  <TableCell colSpan={5} className="h-32 text-center">
                    <p className="text-muted-foreground">
                      No document requests. Create one to request documents from
                      a tenant.
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                requests.map((request) => {
                  const tenant = tenantsById[request.clientId];
                  return (
                    <TableRow key={request.id}>
                      <TableCell>
                        {tenant ? (
                          <Link
                            href={`/tenants/${tenant.id}`}
                            className="font-medium hover:underline"
                          >
                            {tenant.name}
                          </Link>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            {request.clientId.slice(0, 8)}...
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {DOCUMENT_REQUEST_TYPE_LABELS[
                          request.requestType as DocumentRequestType
                        ] ?? request.requestType}
                      </TableCell>
                      <TableCell>
                        <DocumentRequestStatusBadge status={request.status} />
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                        {formatDate(request.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/documents/requests`}>
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {(page > 1 || hasMore) && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">Page {page}</p>
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
                disabled={!hasMore}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
