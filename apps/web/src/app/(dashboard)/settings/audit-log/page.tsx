"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AuditLogTable } from "@/components/audit/audit-log-table";
import { useAuditLogs } from "@/hooks/use-audit-logs";
import {
  AuditAction,
  AuditResourceType,
  AUDIT_ACTION_LABELS,
  AUDIT_RESOURCE_TYPE_LABELS,
} from "@leaselink/shared";

const ALL = "ALL";

export default function AuditLogPage() {
  const searchParams = useSearchParams();

  const [resourceTypeFilter, setResourceTypeFilter] = useState<string>(
    searchParams.get("resourceType") ?? ALL
  );
  const [resourceIdFilter] = useState<string>(
    searchParams.get("resourceId") ?? ""
  );
  const [actionFilter, setActionFilter] = useState<string>(ALL);
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const filters = {
    ...(resourceTypeFilter !== ALL ? { resourceType: resourceTypeFilter } : {}),
    ...(resourceIdFilter ? { resourceId: resourceIdFilter } : {}),
    ...(actionFilter !== ALL ? { action: actionFilter } : {}),
    ...(dateFrom ? { dateFrom: new Date(dateFrom).toISOString() } : {}),
    ...(dateTo
      ? {
          dateTo: new Date(dateTo + "T23:59:59.999Z").toISOString(),
        }
      : {}),
    page,
    pageSize,
  };

  const { data, isLoading } = useAuditLogs(filters);
  const logs = data?.data ?? [];
  const totalCount = data?.meta?.totalCount ?? 0;
  const totalPages = data?.meta?.totalPages ?? 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Audit Log</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Track all actions performed across the platform.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap">
        <Select
          value={resourceTypeFilter}
          onValueChange={(value) => {
            setResourceTypeFilter(value ?? ALL);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-52">
            <SelectValue placeholder="All resource types">
              {(value: string) =>
                value === ALL
                  ? "All resource types"
                  : AUDIT_RESOURCE_TYPE_LABELS[value as AuditResourceType] ??
                    value
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All resource types</SelectItem>
            {Object.values(AuditResourceType).map((rt) => (
              <SelectItem key={rt} value={rt}>
                {AUDIT_RESOURCE_TYPE_LABELS[rt]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={actionFilter}
          onValueChange={(value) => {
            setActionFilter(value ?? ALL);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All actions">
              {(value: string) =>
                value === ALL
                  ? "All actions"
                  : AUDIT_ACTION_LABELS[value as AuditAction] ?? value
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All actions</SelectItem>
            {Object.values(AuditAction).map((action) => (
              <SelectItem key={action} value={action}>
                {AUDIT_ACTION_LABELS[action]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          <Input
            type="date"
            className="w-36"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setPage(1);
            }}
            placeholder="From"
          />
          <span className="text-muted-foreground text-sm">to</span>
          <Input
            type="date"
            className="w-36"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setPage(1);
            }}
            placeholder="To"
          />
        </div>
      </div>

      {resourceIdFilter && (
        <p className="text-sm text-muted-foreground">
          Showing audit trail for resource:{" "}
          <span className="font-mono">{resourceIdFilter}</span>
        </p>
      )}

      <AuditLogTable
        logs={logs}
        isLoading={isLoading}
        page={page}
        totalPages={totalPages}
        totalCount={totalCount}
        onPageChange={setPage}
      />
    </div>
  );
}
