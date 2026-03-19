"use client";

import { Wrench, CreditCard, FileText, Upload } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardRecentActivity } from "@leaselink/shared";
import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";

function relativeTime(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const activityConfig: Record<
  DashboardRecentActivity["type"],
  { icon: LucideIcon; className: string }
> = {
  MAINTENANCE_REQUEST: { icon: Wrench, className: "text-amber-600" },
  PAYMENT: { icon: CreditCard, className: "text-green-600" },
  LEASE_ACTIVATION: { icon: FileText, className: "text-blue-600" },
  DOCUMENT_UPLOAD: { icon: Upload, className: "text-muted-foreground" },
};

interface RecentActivityProps {
  activities: DashboardRecentActivity[];
}

export function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recent activity.</p>
        ) : (
          <ol className="space-y-4">
            {activities.slice(0, 10).map((item) => {
              const config = activityConfig[item.type] ?? {
                icon: FileText,
                className: "text-muted-foreground",
              };
              const Icon = config.icon;
              return (
                <li key={item.id} className="flex items-start gap-3">
                  <span
                    className={cn(
                      "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted",
                      config.className
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {relativeTime(item.timestamp)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
