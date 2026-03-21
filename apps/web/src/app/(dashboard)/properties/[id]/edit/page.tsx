"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PropertyForm,
  type PropertyFormValues,
} from "@/components/properties/property-form";
import { useProperty, useUpdateProperty } from "@/hooks/use-properties";
import { toast } from "sonner";

export default function EditPropertyPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data, isLoading } = useProperty(id);
  const updateMutation = useUpdateProperty(id);

  const property = data?.data;

  async function handleSubmit(data: PropertyFormValues) {
    try {
      await updateMutation.mutateAsync(data as unknown as Record<string, unknown>);
      toast.success("Property updated successfully.");
      router.push(`/properties/${id}`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update property."
      );
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Card>
          <CardContent className="space-y-4 pt-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">
          Property not found
        </h1>
        <Link href="/properties">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Properties
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/properties/${id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Edit Property</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Property Details</CardTitle>
        </CardHeader>
        <CardContent>
          <PropertyForm
            defaultValues={{
              address: property.address,
              city: property.city,
              state: property.state,
              zipCode: property.zipCode,
              propertyType: property.propertyType,
              bedrooms: property.bedrooms,
              bathrooms: property.bathrooms,
              sqft: property.sqft ?? undefined,
              rentAmount: property.rentAmount,
              description: property.description ?? undefined,
            }}
            onSubmit={handleSubmit}
            isSubmitting={updateMutation.isPending}
            submitLabel="Update Property"
          />
        </CardContent>
      </Card>
    </div>
  );
}
