"use client";

import { useRouter } from "next/navigation";
import { Building2, Users, FileText, Wrench } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useDashboardSummary } from "@/hooks/use-dashboard";
import { StatCard } from "@/components/dashboard/stat-card";
import { RevenueSummary } from "@/components/dashboard/revenue-summary";
import { UpcomingExpirations } from "@/components/dashboard/upcoming-expirations";
import { OpenMaintenance } from "@/components/dashboard/open-maintenance";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { SchedulerStatus } from "@/components/dashboard/scheduler-status";

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-64 rounded-xl lg:col-span-2" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useDashboardSummary();

  if (isLoading) return <DashboardSkeleton />;

  if (isError || !data) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4">
          <p className="text-sm text-destructive">
            Failed to load dashboard data.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => refetch()}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const openRequests = data.maintenance.open + data.maintenance.inProgress;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>

      {/* Row 1: Key metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Properties"
          value={data.properties.total}
          subtitle={`${data.properties.occupied} occupied, ${data.properties.vacant} vacant`}
          icon={Building2}
          onClick={() => router.push("/properties")}
        />
        <StatCard
          title="Active Tenants"
          value={data.tenants.active}
          subtitle={`${data.tenants.invited} pending invites`}
          icon={Users}
          onClick={() => router.push("/tenants")}
        />
        <StatCard
          title="Active Leases"
          value={data.leases.active}
          subtitle={`${data.leases.pending} pending activation`}
          icon={FileText}
          onClick={() => router.push("/leases")}
        />
        <StatCard
          title="Open Requests"
          value={openRequests}
          subtitle={`${data.maintenance.emergencyOpen} emergency`}
          subtitleClassName={
            data.maintenance.emergencyOpen > 0 ? "text-destructive" : undefined
          }
          icon={Wrench}
          onClick={() => router.push("/maintenance")}
        />
      </div>

      {/* Row 2: Revenue overview */}
      <RevenueSummary
        expectedThisMonth={data.payments.expectedThisMonth}
        collectedThisMonth={data.payments.collectedThisMonth}
        overdueTotal={data.payments.overdueTotal}
        overdueCount={data.payments.overdueCount}
      />

      {/* Row 3: Expirations + Maintenance */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <UpcomingExpirations expirations={data.upcomingLeaseExpirations} />
        </div>
        <OpenMaintenance
          open={data.maintenance.open}
          inProgress={data.maintenance.inProgress}
          emergencyOpen={data.maintenance.emergencyOpen}
        />
      </div>

      {/* Row 4: Recent activity */}
      <RecentActivity activities={data.recentActivity} />

      {/* Row 5: Scheduler status */}
      <SchedulerStatus />
    </div>
  );
}
