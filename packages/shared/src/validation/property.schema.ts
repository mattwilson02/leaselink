import { z } from "zod";
import { PropertyType, PropertyStatus } from "../enums";

export const createPropertySchema = z.object({
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zipCode: z.string().min(1, "Zip code is required"),
  propertyType: z.nativeEnum(PropertyType),
  bedrooms: z.number().int().min(0, "Bedrooms must be 0 or more"),
  bathrooms: z.number().min(0, "Bathrooms must be 0 or more"),
  sqft: z.number().int().positive().optional(),
  rentAmount: z.number().positive("Rent amount must be greater than 0"),
  description: z.string().optional(),
});

export const updatePropertySchema = z.object({
  address: z.string().min(1).optional(),
  city: z.string().min(1).optional(),
  state: z.string().min(1).optional(),
  zipCode: z.string().min(1).optional(),
  propertyType: z.nativeEnum(PropertyType).optional(),
  bedrooms: z.number().int().min(0).optional(),
  bathrooms: z.number().min(0).optional(),
  sqft: z.number().int().positive().nullable().optional(),
  rentAmount: z.number().positive().optional(),
  description: z.string().nullable().optional(),
});

export const propertyFilterSchema = z.object({
  status: z.nativeEnum(PropertyStatus).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(200).default(20),
});

export type CreatePropertyInput = z.infer<typeof createPropertySchema>;
export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>;
export type PropertyFilterInput = z.infer<typeof propertyFilterSchema>;
