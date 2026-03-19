"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PropertyType,
  PROPERTY_TYPE_LABELS,
  createPropertySchema,
} from "@leaselink/shared";

// Use the shared schema for create, and make all fields required for the form
const propertyFormSchema = createPropertySchema;

export type PropertyFormValues = z.infer<typeof propertyFormSchema>;

interface PropertyFormProps {
  defaultValues?: Partial<PropertyFormValues>;
  onSubmit: (data: PropertyFormValues) => void;
  isSubmitting?: boolean;
  submitLabel?: string;
}

export function PropertyForm({
  defaultValues,
  onSubmit,
  isSubmitting = false,
  submitLabel = "Save Property",
}: PropertyFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PropertyFormValues>({
    resolver: zodResolver(propertyFormSchema),
    defaultValues: {
      address: "",
      city: "",
      state: "",
      zipCode: "",
      propertyType: PropertyType.APARTMENT,
      bedrooms: 1,
      bathrooms: 1,
      rentAmount: 0,
      ...defaultValues,
    },
  });

  const propertyType = watch("propertyType");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="address">Address</Label>
          <Input id="address" {...register("address")} />
          {errors.address && (
            <p className="text-sm text-destructive">{errors.address.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input id="city" {...register("city")} />
          {errors.city && (
            <p className="text-sm text-destructive">{errors.city.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="state">State</Label>
            <Input id="state" {...register("state")} />
            {errors.state && (
              <p className="text-sm text-destructive">
                {errors.state.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="zipCode">Zip Code</Label>
            <Input id="zipCode" {...register("zipCode")} />
            {errors.zipCode && (
              <p className="text-sm text-destructive">
                {errors.zipCode.message}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="propertyType">Property Type</Label>
          <Select
            value={propertyType}
            onValueChange={(value) => {
              if (value) setValue("propertyType", value as PropertyType);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {Object.values(PropertyType).map((type) => (
                <SelectItem key={type} value={type}>
                  {PROPERTY_TYPE_LABELS[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.propertyType && (
            <p className="text-sm text-destructive">
              {errors.propertyType.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="rentAmount">Monthly Rent ($)</Label>
          <Input
            id="rentAmount"
            type="number"
            step="0.01"
            {...register("rentAmount", { valueAsNumber: true })}
          />
          {errors.rentAmount && (
            <p className="text-sm text-destructive">
              {errors.rentAmount.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="bedrooms">Bedrooms</Label>
          <Input
            id="bedrooms"
            type="number"
            {...register("bedrooms", { valueAsNumber: true })}
          />
          {errors.bedrooms && (
            <p className="text-sm text-destructive">
              {errors.bedrooms.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="bathrooms">Bathrooms</Label>
          <Input
            id="bathrooms"
            type="number"
            step="0.5"
            {...register("bathrooms", { valueAsNumber: true })}
          />
          {errors.bathrooms && (
            <p className="text-sm text-destructive">
              {errors.bathrooms.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="sqft">
            Square Feet <span className="text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id="sqft"
            type="number"
            {...register("sqft", {
              setValueAs: (v) => (v === "" ? undefined : Number(v)),
            })}
          />
          {errors.sqft && (
            <p className="text-sm text-destructive">{errors.sqft.message}</p>
          )}
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="description">
            Description{" "}
            <span className="text-muted-foreground">(optional)</span>
          </Label>
          <Textarea id="description" rows={4} {...register("description")} />
          {errors.description && (
            <p className="text-sm text-destructive">
              {errors.description.message}
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
