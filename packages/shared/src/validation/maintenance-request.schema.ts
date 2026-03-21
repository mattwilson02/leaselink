import { z } from "zod";
import {
  MaintenancePriority,
  MaintenanceStatus,
  MaintenanceCategory,
} from "../enums";

export const createMaintenanceRequestSchema = z.object({
  propertyId: z.string().uuid("Invalid property ID"),
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be 200 characters or less"),
  description: z
    .string()
    .min(1, "Description is required")
    .max(5000, "Description must be 5000 characters or less"),
  category: z.nativeEnum(MaintenanceCategory),
  priority: z.nativeEnum(MaintenancePriority).default(MaintenancePriority.MEDIUM),
});

export const updateMaintenanceRequestSchema = z.object({
  status: z.nativeEnum(MaintenanceStatus).optional(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(5000).optional(),
  priority: z.nativeEnum(MaintenancePriority).optional(),
});

export const maintenanceRequestFilterSchema = z.object({
  status: z.nativeEnum(MaintenanceStatus).optional(),
  priority: z.nativeEnum(MaintenancePriority).optional(),
  category: z.nativeEnum(MaintenanceCategory).optional(),
  propertyId: z.string().uuid().optional(),
  tenantId: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(200).default(20),
});

export type CreateMaintenanceRequestInput = z.infer<
  typeof createMaintenanceRequestSchema
>;
export type UpdateMaintenanceRequestInput = z.infer<
  typeof updateMaintenanceRequestSchema
>;
export type MaintenanceRequestFilterInput = z.infer<
  typeof maintenanceRequestFilterSchema
>;
