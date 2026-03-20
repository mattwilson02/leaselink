"use client";

import { useParams, useRouter } from "next/navigation";
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
import { Skeleton } from "@/components/ui/skeleton";
import { RenewLeaseForm } from "@/components/leases/renew-lease-form";
import { useLease, useRenewLease } from "@/hooks/use-leases";
import { useProperty } from "@/hooks/use-properties";
import { useTenant } from "@/hooks/use-tenants";
import { toast } from "sonner";
import { z } from "zod";
import { renewLeaseSchema } from "@leaselink/shared";

type RenewLeaseFormValues = z.infer<typeof renewLeaseSchema>;

export default function RenewLeasePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: leaseData, isLoading } = useLease(id);
  const lease = leaseData?.data;

  const { data: propertyData } = useProperty(lease?.propertyId ?? "");
  const { data: tenantData } = useTenant(lease?.tenantId ?? "");

  const renewMutation = useRenewLease(id);

  function handleSubmit(data: RenewLeaseFormValues) {
    renewMutation.mutate(data, {
      onSuccess: (result) => {
        toast.success("Lease renewed successfully.");
        router.push(`/leases/${result.data.id}`);
      },
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : "Failed to renew lease.");
      },
    });
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Card>
          <CardContent className="space-y-4 pt-6">
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-4 w-48" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!lease) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Lease not found</h1>
        <Link href="/leases">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Leases
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/leases/${id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Renew Lease</h1>
          <p className="text-muted-foreground">
            Create a renewal for this lease
          </p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Renewal Terms</CardTitle>
          <CardDescription>
            Review and update the lease terms for the renewal period.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RenewLeaseForm
            originalLease={lease}
            property={propertyData?.property}
            tenant={tenantData?.data}
            isSubmitting={renewMutation.isPending}
            onSubmit={handleSubmit}
            onCancel={() => router.push(`/leases/${id}`)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
