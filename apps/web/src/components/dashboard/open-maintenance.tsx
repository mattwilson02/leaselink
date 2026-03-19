"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface OpenMaintenanceProps {
  open: number;
  inProgress: number;
  emergencyOpen: number;
}

export function OpenMaintenance({
  open,
  inProgress,
  emergencyOpen,
}: OpenMaintenanceProps) {
  const total = open + inProgress;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Open Maintenance</CardTitle>
        <Link
          href="/maintenance?status=OPEN"
          className="text-xs text-muted-foreground underline-offset-2 hover:underline"
        >
          View all
        </Link>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Total open</span>
          <span className="text-sm font-semibold">{total}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">In progress</span>
          <span className="text-sm font-semibold">{inProgress}</span>
        </div>
        {emergencyOpen > 0 && (
          <div className="flex items-center justify-between rounded-md bg-destructive/10 px-3 py-2">
            <span className="text-sm font-medium text-destructive">Emergency</span>
            <Badge variant="destructive">{emergencyOpen}</Badge>
          </div>
        )}
        {emergencyOpen === 0 && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Emergency</span>
            <span className="text-sm font-semibold">0</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
