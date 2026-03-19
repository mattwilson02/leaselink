"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LeaseForm } from "@/components/leases/lease-form";
import { useCreateLease } from "@/hooks/use-leases";
import { useProperties } from "@/hooks/use-properties";
import { useTenants } from "@/hooks/use-tenants";
import { toast } from "sonner";
import { z } from "zod";
import { createLeaseSchema } from "@leaselink/shared";

type LeaseFormValues = z.infer<typeof createLeaseSchema>;

export default function NewLeasePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultPropertyId = searchParams.get("propertyId") ?? undefined;

  const { data: propertiesData, isLoading: propertiesLoading } = useProperties({
    pageSize: 200,
  });
  const { data: tenantsData, isLoading: tenantsLoading } = useTenants({
    pageSize: 200,
  });
  const createLease = useCreateLease();

  const [propertyError, setPropertyError] = useState<string | undefined>();
  const [tenantError, setTenantError] = useState<string | undefined>();

  const properties = propertiesData?.data ?? [];
  const tenants = tenantsData?.data ?? [];

  function handleSubmit(data: LeaseFormValues) {
    setPropertyError(undefined);
    setTenantError(undefined);

    createLease.mutate(data, {
      onSuccess: (result) => {
        toast.success("Lease created successfully.");
        router.push(`/leases/${result.data.id}`);
      },
      onError: (err) => {
        const message = err instanceof Error ? err.message : "Failed to create lease.";
        if (message.toLowerCase().includes("property already has an active lease")) {
          setPropertyError("Property already has an active lease");
        } else if (message.toLowerCase().includes("tenant already has an active lease")) {
          setTenantError("Tenant already has an active lease");
        } else {
          toast.error(message);
        }
      },
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/leases">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create Lease</h1>
          <p className="text-muted-foreground">
            Set up a new lease agreement
          </p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Lease Details</CardTitle>
          <CardDescription>
            Select a property and tenant, then set the lease terms.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {propertiesLoading || tenantsLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : (
            <LeaseForm
              properties={properties}
              tenants={tenants}
              isSubmitting={createLease.isPending}
              onSubmit={handleSubmit}
              onCancel={() => router.push("/leases")}
              propertyError={propertyError}
              tenantError={tenantError}
              defaultPropertyId={defaultPropertyId}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
