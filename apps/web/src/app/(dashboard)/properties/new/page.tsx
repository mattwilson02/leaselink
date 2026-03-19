"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PropertyForm,
  type PropertyFormValues,
} from "@/components/properties/property-form";
import { useCreateProperty } from "@/hooks/use-properties";
import { toast } from "sonner";

export default function NewPropertyPage() {
  const router = useRouter();
  const createMutation = useCreateProperty();

  async function handleSubmit(data: PropertyFormValues) {
    try {
      await createMutation.mutateAsync(data as unknown as Record<string, unknown>);
      toast.success("Property created successfully.");
      router.push("/properties");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create property."
      );
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Add Property</h1>
      <Card>
        <CardHeader>
          <CardTitle>Property Details</CardTitle>
        </CardHeader>
        <CardContent>
          <PropertyForm
            onSubmit={handleSubmit}
            isSubmitting={createMutation.isPending}
            submitLabel="Create Property"
          />
        </CardContent>
      </Card>
    </div>
  );
}
