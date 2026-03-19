import { z } from "zod";
import { TenantStatus, OnboardingStatus } from "../enums";

export const createTenantSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phoneNumber: z.string().min(1, "Phone number is required"),
});

export const updateTenantStatusSchema = z.object({
  status: z.nativeEnum(TenantStatus),
});

export const setNotificationPreferencesSchema = z.object({
  receivesEmailNotifications: z.boolean().optional(),
  receivesPushNotifications: z.boolean().optional(),
  receivesNotificationsForMaintenance: z.boolean().optional(),
  receivesNotificationsForDocuments: z.boolean().optional(),
});

export const tenantFilterSchema = z.object({
  status: z.nativeEnum(TenantStatus).optional(),
  onboardingStatus: z.nativeEnum(OnboardingStatus).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export type CreateTenantInput = z.infer<typeof createTenantSchema>;
export type UpdateTenantStatusInput = z.infer<typeof updateTenantStatusSchema>;
export type SetNotificationPreferencesInput = z.infer<
  typeof setNotificationPreferencesSchema
>;
export type TenantFilterInput = z.infer<typeof tenantFilterSchema>;
