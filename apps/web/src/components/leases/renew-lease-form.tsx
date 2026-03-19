"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { renewLeaseSchema } from "@leaselink/shared";
import type { Lease, Property, Tenant } from "@leaselink/shared";

type RenewLeaseFormValues = z.infer<typeof renewLeaseSchema>;

interface RenewLeaseFormProps {
  originalLease: Lease;
  property?: Property;
  tenant?: Tenant;
  isSubmitting?: boolean;
  onSubmit: (data: RenewLeaseFormValues) => void;
  onCancel?: () => void;
}

function toDateInputValue(isoString: string): string {
  return isoString ? isoString.split("T")[0] : "";
}

function toISOString(dateString: string): string {
  if (!dateString) return "";
  return new Date(dateString).toISOString();
}

function addOneYear(dateString: string): string {
  const d = new Date(dateString);
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().split("T")[0];
}

export function RenewLeaseForm({
  originalLease,
  property,
  tenant,
  isSubmitting = false,
  onSubmit,
  onCancel,
}: RenewLeaseFormProps) {
  const defaultStartDate = toDateInputValue(originalLease.endDate);
  const defaultEndDate = addOneYear(originalLease.endDate);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RenewLeaseFormValues>({
    resolver: zodResolver(renewLeaseSchema),
    defaultValues: {
      startDate: defaultStartDate,
      endDate: defaultEndDate,
      monthlyRent: originalLease.monthlyRent,
      securityDeposit: originalLease.securityDeposit,
    },
  });

  function handleFormSubmit(data: RenewLeaseFormValues) {
    const transformed: RenewLeaseFormValues = {
      ...data,
      startDate: toISOString(data.startDate),
      endDate: toISOString(data.endDate),
    };
    onSubmit(transformed);
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {(property || tenant) && (
        <div className="grid gap-4 sm:grid-cols-2 rounded-md border p-4 bg-muted/40">
          {property && (
            <div>
              <p className="text-sm font-medium">Property</p>
              <p className="text-sm text-muted-foreground">
                {property.address}, {property.city}
              </p>
            </div>
          )}
          {tenant && (
            <div>
              <p className="text-sm font-medium">Tenant</p>
              <p className="text-sm text-muted-foreground">
                {tenant.name} — {tenant.email}
              </p>
            </div>
          )}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="startDate">New Start Date</Label>
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
          <Label htmlFor="endDate">New End Date</Label>
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
          {isSubmitting ? "Renewing..." : "Renew Lease"}
        </Button>
      </div>
    </form>
  );
}
