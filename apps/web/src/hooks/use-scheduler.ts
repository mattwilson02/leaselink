"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface SchedulerTask {
  name: string;
  schedule: string;
  description: string;
}

export interface SchedulerStatus {
  enabled: boolean;
  tasks: SchedulerTask[];
}

export function useSchedulerStatus() {
  return useQuery({
    queryKey: ["scheduler-status"],
    queryFn: () => apiClient.get<SchedulerStatus>("/scheduler/status"),
    staleTime: 60_000,
  });
}
