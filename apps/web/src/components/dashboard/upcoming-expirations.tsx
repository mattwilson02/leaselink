"use client";

import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardLeaseExpiration } from "@leaselink/shared";

interface UpcomingExpirationsProps {
  expirations: DashboardLeaseExpiration[];
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function daysLeftClass(days: number): string {
  if (days < 30) return "text-destructive font-medium";
  if (days < 60) return "text-amber-600 font-medium";
  return "";
}

export function UpcomingExpirations({ expirations }: UpcomingExpirationsProps) {
  const rows = expirations.slice(0, 10);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Upcoming Lease Expirations</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {rows.length === 0 ? (
          <p className="px-6 pb-6 text-sm text-muted-foreground">
            No leases expiring soon.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Property</TableHead>
                <TableHead>Tenant</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead className="text-right">Days Left</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.propertyAddress}</TableCell>
                  <TableCell>{item.tenantName}</TableCell>
                  <TableCell>{formatDate(item.endDate)}</TableCell>
                  <TableCell
                    className={cn("text-right", daysLeftClass(item.daysUntilExpiry))}
                  >
                    {item.daysUntilExpiry}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
