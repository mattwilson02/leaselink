"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSchedulerStatus } from "@/hooks/use-scheduler";
import { cn } from "@/lib/utils";

export function SchedulerStatus() {
  const { data, isLoading, isError } = useSchedulerStatus();

  if (isLoading) {
    return null;
  }

  if (isError || !data) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">Automated Tasks</CardTitle>
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              "h-2 w-2 rounded-full",
              data.enabled ? "bg-green-500" : "bg-red-500"
            )}
          />
          <span
            className={cn(
              "text-xs font-medium",
              data.enabled ? "text-green-600" : "text-red-600"
            )}
          >
            {data.enabled ? "Active" : "Disabled"}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {data.tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">No scheduled tasks configured.</p>
        ) : (
          <ul className="space-y-3">
            {data.tasks.map((task) => (
              <li key={task.name} className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{task.name}</p>
                  <p className="text-xs text-muted-foreground">{task.description}</p>
                </div>
                <span className="shrink-0 rounded-md bg-muted px-2 py-0.5 text-xs font-mono text-muted-foreground">
                  {task.schedule}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
