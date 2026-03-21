"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AuditActionBadge } from "./audit-action-badge";
import { AuditResourceBadge } from "./audit-resource-badge";
import { AuditResourceType } from "@leaselink/shared";
import type { AuditLog } from "@leaselink/shared";
import { ChevronDown, ChevronRight } from "lucide-react";

interface AuditLogTableProps {
  logs: AuditLog[];
  isLoading: boolean;
  page: number;
  totalPages: number;
  totalCount: number;
  onPageChange: (page: number) => void;
}

function formatDateTime(isoString: string) {
  return new Date(isoString).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
}

function getResourceUrl(resourceType: string, resourceId: string): string | null {
  switch (resourceType) {
    case AuditResourceType.PROPERTY:
      return `/properties/${resourceId}`;
    case AuditResourceType.LEASE:
      return `/leases/${resourceId}`;
    case AuditResourceType.TENANT:
      return `/tenants/${resourceId}`;
    case AuditResourceType.PAYMENT:
      return `/payments/${resourceId}`;
    case AuditResourceType.MAINTENANCE_REQUEST:
      return `/maintenance/${resourceId}`;
    case AuditResourceType.DOCUMENT:
      return `/documents/${resourceId}`;
    case AuditResourceType.EXPENSE:
      return `/expenses/${resourceId}`;
    case AuditResourceType.VENDOR:
      return `/vendors/${resourceId}`;
    default:
      return null;
  }
}

function shortId(id: string) {
  return id.length > 8 ? `${id.slice(0, 8)}...` : id;
}

function MetadataRow({ metadata }: { metadata: Record<string, unknown> | null }) {
  if (!metadata || Object.keys(metadata).length === 0) {
    return <span className="text-muted-foreground text-xs">—</span>;
  }
  return (
    <pre className="mt-1 text-xs text-muted-foreground bg-muted rounded p-2 overflow-x-auto max-w-xs">
      {JSON.stringify(metadata, null, 2)}
    </pre>
  );
}

export function AuditLogTable({
  logs,
  isLoading,
  page,
  totalPages,
  totalCount,
  onPageChange,
}: AuditLogTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  function toggleRow(id: string) {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8" />
              <TableHead>Timestamp</TableHead>
              <TableHead className="hidden sm:table-cell">Actor</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Resource Type</TableHead>
              <TableHead className="hidden md:table-cell">Resource ID</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {[1, 2, 3, 4, 5, 6].map((j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  <p className="text-muted-foreground">No audit logs yet.</p>
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log: AuditLog) => {
                const isExpanded = expandedRows.has(log.id);
                const resourceUrl = getResourceUrl(log.resourceType, log.resourceId);

                return (
                  <>
                    <TableRow
                      key={log.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => toggleRow(log.id)}
                    >
                      <TableCell className="w-8">
                        {isExpanded ? (
                          <ChevronDown className="h-3 w-3 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-3 w-3 text-muted-foreground" />
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm">
                        {formatDateTime(log.createdAt)}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground font-mono">
                        {shortId(log.actorId)}
                      </TableCell>
                      <TableCell>
                        <AuditActionBadge action={log.action} />
                      </TableCell>
                      <TableCell>
                        <AuditResourceBadge resourceType={log.resourceType} />
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm">
                        {resourceUrl ? (
                          <Link
                            href={resourceUrl}
                            className="font-mono text-xs hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {shortId(log.resourceId)}
                          </Link>
                        ) : (
                          <span className="font-mono text-xs text-muted-foreground">
                            {shortId(log.resourceId)}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow key={`${log.id}-detail`}>
                        <TableCell />
                        <TableCell colSpan={5} className="pb-3 pt-0">
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground">
                              Actor ID:{" "}
                              <span className="font-mono">{log.actorId}</span>
                              {" "}({log.actorType})
                            </p>
                            <p className="text-xs font-medium text-muted-foreground">
                              Resource ID:{" "}
                              {resourceUrl ? (
                                <Link
                                  href={resourceUrl}
                                  className="font-mono hover:underline"
                                >
                                  {log.resourceId}
                                </Link>
                              ) : (
                                <span className="font-mono">{log.resourceId}</span>
                              )}
                            </p>
                            <p className="text-xs font-medium text-muted-foreground">
                              Details:
                            </p>
                            <MetadataRow metadata={log.metadata} />
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing page {page} of {totalPages} ({totalCount}{" "}
            {totalCount === 1 ? "entry" : "entries"})
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
