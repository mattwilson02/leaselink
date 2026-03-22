"use client";

import { useRouter } from "next/navigation";
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
import { VendorForm, type VendorFormValues } from "@/components/vendors/vendor-form";
import { useCreateVendor } from "@/hooks/use-vendors";
import { toast } from "sonner";

export default function NewVendorPage() {
  const router = useRouter();
  const createMutation = useCreateVendor();

  function handleSubmit(data: VendorFormValues) {
    createMutation.mutate(
      {
        name: data.name,
        specialty: data.specialty,
        phone: data.phone || undefined,
        email: data.email || undefined,
        notes: data.notes || undefined,
      },
      {
        onSuccess: (result) => {
          toast.success("Vendor created.");
          router.push(`/vendors/${result?.vendor?.id ?? ""}`);
        },
        onError: (err) => {
          toast.error(
            err instanceof Error ? err.message : "Failed to create vendor."
          );
        },
      }
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/vendors">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Add Vendor</h1>
          <p className="text-muted-foreground">
            Register a new vendor or contractor.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vendor Details</CardTitle>
          <CardDescription>
            Fill in the details for this vendor.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <VendorForm
            onSubmit={handleSubmit}
            isSubmitting={createMutation.isPending}
            submitLabel="Create Vendor"
          />
        </CardContent>
      </Card>
    </div>
  );
}
