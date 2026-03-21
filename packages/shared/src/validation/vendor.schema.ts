import { z } from "zod";
import { MaintenanceCategory } from "../enums";

export const createVendorSchema = z.object({
  name: z.string().min(1, "Name is required"),
  specialty: z.nativeEnum(MaintenanceCategory),
  phone: z.string().optional(),
  email: z
    .string()
    .email("Invalid email address")
    .optional()
    .or(z.literal("")),
  notes: z.string().optional(),
});

export const updateVendorSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  specialty: z.nativeEnum(MaintenanceCategory).optional(),
  phone: z.string().nullable().optional(),
  email: z
    .string()
    .email("Invalid email address")
    .nullable()
    .optional()
    .or(z.literal("")),
  notes: z.string().nullable().optional(),
});

export const vendorFilterSchema = z.object({
  specialty: z.nativeEnum(MaintenanceCategory).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export type CreateVendorInput = z.infer<typeof createVendorSchema>;
export type UpdateVendorInput = z.infer<typeof updateVendorSchema>;
export type VendorFilterInput = z.infer<typeof vendorFilterSchema>;
