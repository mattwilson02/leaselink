"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

interface CurrentUserResponse {
  id: string;
  name: string;
  email: string;
  type: "EMPLOYEE" | "CLIENT";
  role?: string;
  status?: string;
  authUserId: string;
  createdAt: string;
  updatedAt: string | null;
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ["me"],
    queryFn: () => apiClient.get<CurrentUserResponse>("/auth/me"),
  });
}
