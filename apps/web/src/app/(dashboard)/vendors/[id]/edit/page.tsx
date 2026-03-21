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
import { VendorForm, type VendorFormValues } from "@/components/vendors/vendor-form";
import { useVendor, useUpdateVendor } from "@/hooks/use-vendors";
import { MaintenanceCategory } from "@leaselink/shared";
import { toast } from "sonner";

export default function EditVendorPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data, isLoading } = useVendor(id);
  const vendor = data?.vendor;

  const updateMutation = useUpdateVendor(id);

  function handleSubmit(data: VendorFormValues) {
    updateMutation.mutate(
      {
        name: data.name,
        specialty: data.specialty,
        phone: data.phone || null,
        email: data.email || null,
        notes: data.notes || null,
      },
      {
        onSuccess: () => {
          toast.success("Vendor updated.");
          router.push(`/vendors/${id}`);
        },
        onError: (err) => {
          toast.error(
            err instanceof Error ? err.message : "Failed to update vendor."
          );
        },
      }
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Card>
          <CardContent className="space-y-4 pt-6">
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-32" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Vendor not found</h1>
        <Link href="/vendors">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Vendors
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/vendors/${id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Edit Vendor
          </h1>
          <p className="text-muted-foreground">{vendor.name}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vendor Details</CardTitle>
          <CardDescription>Update the details for this vendor.</CardDescription>
        </CardHeader>
        <CardContent>
          <VendorForm
            defaultValues={{
              name: vendor.name,
              specialty: vendor.specialty as MaintenanceCategory,
              phone: vendor.phone ?? "",
              email: vendor.email ?? "",
              notes: vendor.notes ?? "",
            }}
            onSubmit={handleSubmit}
            isSubmitting={updateMutation.isPending}
            submitLabel="Save Changes"
          />
        </CardContent>
      </Card>
    </div>
  );
}
