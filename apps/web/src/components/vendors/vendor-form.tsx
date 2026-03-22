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
  MaintenanceCategory,
  MAINTENANCE_CATEGORY_LABELS,
} from "@leaselink/shared";

const vendorFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  specialty: z.nativeEnum(MaintenanceCategory, {
    required_error: "Specialty is required",
  }),
  phone: z.string().optional().or(z.literal("")),
  email: z
    .string()
    .email("Invalid email address")
    .optional()
    .or(z.literal("")),
  notes: z.string().optional(),
});

export type VendorFormValues = z.infer<typeof vendorFormSchema>;

interface VendorFormProps {
  defaultValues?: Partial<VendorFormValues>;
  onSubmit: (data: VendorFormValues) => void;
  isSubmitting?: boolean;
  submitLabel?: string;
}

export function VendorForm({
  defaultValues,
  onSubmit,
  isSubmitting = false,
  submitLabel = "Save Vendor",
}: VendorFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<VendorFormValues>({
    resolver: zodResolver(vendorFormSchema),
    defaultValues: {
      name: "",
      specialty: undefined,
      phone: "",
      email: "",
      notes: "",
      ...defaultValues,
    },
  });

  const specialty = watch("specialty");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            placeholder="Vendor or company name"
            {...register("name")}
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="specialty">Specialty</Label>
          <Select
            value={specialty}
            onValueChange={(value) => {
              if (value) setValue("specialty", value as MaintenanceCategory);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select specialty">
                {(value: string) =>
                  MAINTENANCE_CATEGORY_LABELS[value as MaintenanceCategory] ??
                  "Select specialty"
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {Object.values(MaintenanceCategory).map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {MAINTENANCE_CATEGORY_LABELS[cat]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.specialty && (
            <p className="text-sm text-destructive">
              {errors.specialty.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" type="tel" placeholder="(555) 000-0000" {...register("phone")} />
          {errors.phone && (
            <p className="text-sm text-destructive">{errors.phone.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="vendor@example.com"
            {...register("email")}
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            rows={3}
            placeholder="Any additional notes about this vendor..."
            {...register("notes")}
          />
          {errors.notes && (
            <p className="text-sm text-destructive">{errors.notes.message}</p>
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
