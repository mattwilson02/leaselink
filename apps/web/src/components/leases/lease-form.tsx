"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createLeaseSchema } from "@leaselink/shared";
import type { Property, Tenant } from "@leaselink/shared";

type LeaseFormValues = z.infer<typeof createLeaseSchema>;

interface LeaseFormProps {
  properties: Property[];
  tenants: Tenant[];
  isSubmitting?: boolean;
  onSubmit: (data: LeaseFormValues) => void;
  onCancel?: () => void;
  propertyError?: string;
  tenantError?: string;
  defaultPropertyId?: string;
}

function toDateInputValue(isoString: string): string {
  return isoString ? isoString.split("T")[0] : "";
}

function toISOString(dateString: string): string {
  if (!dateString) return "";
  return new Date(dateString).toISOString();
}

export function LeaseForm({
  properties,
  tenants,
  isSubmitting = false,
  onSubmit,
  onCancel,
  propertyError,
  tenantError,
  defaultPropertyId,
}: LeaseFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<LeaseFormValues>({
    resolver: zodResolver(createLeaseSchema),
    defaultValues: {
      propertyId: defaultPropertyId ?? "",
      tenantId: "",
      startDate: "",
      endDate: "",
      monthlyRent: 0,
      securityDeposit: 0,
    },
  });

  const selectedPropertyId = watch("propertyId");

  // Pre-fill monthly rent from selected property
  useEffect(() => {
    const property = properties.find((p) => p.id === selectedPropertyId);
    if (property) {
      setValue("monthlyRent", property.rentAmount);
    }
  }, [selectedPropertyId, properties, setValue]);

  function handleFormSubmit(data: LeaseFormValues) {
    const transformed: LeaseFormValues = {
      ...data,
      startDate: toISOString(data.startDate),
      endDate: toISOString(data.endDate),
    };
    onSubmit(transformed);
  }

  const eligibleProperties = properties.filter(
    (p) => p.status === "LISTED" || p.status === "OCCUPIED"
  );
  const activeTenantsOnly = tenants.filter((t) => t.status === "ACTIVE");

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="propertyId">Property</Label>
          <Controller
            name="propertyId"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a property" />
                </SelectTrigger>
                <SelectContent>
                  {eligibleProperties.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.address}, {p.city} — {p.status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {(errors.propertyId || propertyError) && (
            <p className="text-sm text-destructive">
              {errors.propertyId?.message ?? propertyError}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="tenantId">Tenant</Label>
          <Controller
            name="tenantId"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a tenant" />
                </SelectTrigger>
                <SelectContent>
                  {activeTenantsOnly.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} — {t.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {(errors.tenantId || tenantError) && (
            <p className="text-sm text-destructive">
              {errors.tenantId?.message ?? tenantError}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="startDate">Start Date</Label>
          <Input
            id="startDate"
            type="date"
            {...register("startDate")}
          />
          {errors.startDate && (
            <p className="text-sm text-destructive">
              {errors.startDate.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="endDate">End Date</Label>
          <Input
            id="endDate"
            type="date"
            {...register("endDate")}
          />
          {errors.endDate && (
            <p className="text-sm text-destructive">{errors.endDate.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="monthlyRent">Monthly Rent ($)</Label>
          <Input
            id="monthlyRent"
            type="number"
            step="0.01"
            {...register("monthlyRent", { valueAsNumber: true })}
          />
          {errors.monthlyRent && (
            <p className="text-sm text-destructive">
              {errors.monthlyRent.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="securityDeposit">Security Deposit ($)</Label>
          <Input
            id="securityDeposit"
            type="number"
            step="0.01"
            {...register("securityDeposit", { valueAsNumber: true })}
          />
          {errors.securityDeposit && (
            <p className="text-sm text-destructive">
              {errors.securityDeposit.message}
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Create Lease"}
        </Button>
      </div>
    </form>
  );
}
