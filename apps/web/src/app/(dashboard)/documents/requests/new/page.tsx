"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useCreateDocumentRequest } from "@/hooks/use-document-requests";
import { useTenants } from "@/hooks/use-tenants";
import {
  createDocumentRequestSchema,
  DocumentRequestType,
  DOCUMENT_REQUEST_TYPE_LABELS,
} from "@leaselink/shared";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { useQuery } from "@tanstack/react-query";

type FormValues = z.infer<typeof createDocumentRequestSchema>;

function useCurrentUser() {
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => apiClient.get<{ id: string; name?: string }>("/auth/me"),
  });
}

export default function NewDocumentRequestPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedTenantId = searchParams.get("tenantId");

  const { data: tenantsData } = useTenants({ pageSize: 200 });
  const { data: currentUser } = useCurrentUser();
  const createRequest = useCreateDocumentRequest();

  const tenants = tenantsData?.data ?? [];

  const {
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(createDocumentRequestSchema),
    defaultValues: {
      tenantId: preselectedTenantId ?? "",
      requestType: null as unknown as DocumentRequestType,
    },
  });

  useEffect(() => {
    if (preselectedTenantId) {
      setValue("tenantId", preselectedTenantId);
    }
  }, [preselectedTenantId, setValue]);

  const tenantId = watch("tenantId");
  const requestType = watch("requestType");

  function onSubmit(data: FormValues) {
    if (!currentUser?.id) {
      toast.error("Unable to identify current user. Please try again.");
      return;
    }

    const selectedTenant = tenants.find((t) => t.id === data.tenantId);

    createRequest.mutate(
      {
        clientId: data.tenantId,
        requestedBy: currentUser.id,
        requestType: data.requestType,
      },
      {
        onSuccess: () => {
          toast.success(
            `Document request sent to ${selectedTenant?.name ?? "tenant"}.`
          );
          router.push("/documents/requests");
        },
        onError: (err) => {
          toast.error(
            err instanceof Error ? err.message : "Failed to create request."
          );
        },
      }
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/documents/requests">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">
          Create Document Request
        </h1>
      </div>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Request Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="tenant">Tenant</Label>
              <Select
                value={tenantId}
                onValueChange={(value) => setValue("tenantId", value ?? "")}
              >
                <SelectTrigger id="tenant" className="w-full">
                  <SelectValue placeholder="Select a tenant">
                    {(value: string) => {
                      const t = tenants.find((t) => t.id === value);
                      return t ? t.name : "Select a tenant";
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {tenants.map((tenant) => (
                    <SelectItem key={tenant.id} value={tenant.id}>
                      {tenant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.tenantId && (
                <p className="text-sm text-destructive">
                  {errors.tenantId.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="requestType">Request Type</Label>
              <Select
                value={requestType}
                onValueChange={(value) =>
                  setValue("requestType", value as DocumentRequestType)
                }
              >
                <SelectTrigger id="requestType" className="w-full">
                  <SelectValue placeholder="Select a request type">
                    {(value: string) =>
                      DOCUMENT_REQUEST_TYPE_LABELS[value as DocumentRequestType] ?? "Select a request type"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {Object.values(DocumentRequestType).map((type) => (
                    <SelectItem key={type} value={type}>
                      {DOCUMENT_REQUEST_TYPE_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.requestType && (
                <p className="text-sm text-destructive">
                  {errors.requestType.message}
                </p>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="submit"
                disabled={createRequest.isPending}
              >
                {createRequest.isPending ? "Sending..." : "Send Request"}
              </Button>
              <Link href="/documents/requests">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
