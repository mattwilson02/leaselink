import { z } from "zod";
import { LeaseStatus } from "../enums";

// Accepts both YYYY-MM-DD (from HTML date inputs) and full ISO datetime strings
const dateString = (label: string) =>
  z.string().refine((val) => !Number.isNaN(Date.parse(val)), {
    message: `Invalid ${label}`,
  });

export const createLeaseSchema = z
  .object({
    propertyId: z.string().uuid("Invalid property ID"),
    tenantId: z.string().uuid("Invalid tenant ID"),
    startDate: dateString("start date"),
    endDate: dateString("end date"),
    monthlyRent: z.number().positive("Monthly rent must be greater than 0"),
    securityDeposit: z
      .number()
      .min(0, "Security deposit must be 0 or more"),
  })
  .refine((data) => new Date(data.endDate) > new Date(data.startDate), {
    message: "End date must be after start date",
    path: ["endDate"],
  });

export const updateLeaseStatusSchema = z.object({
  status: z.nativeEnum(LeaseStatus),
});

export const renewLeaseSchema = z
  .object({
    startDate: dateString("start date"),
    endDate: dateString("end date"),
    monthlyRent: z.number().positive("Monthly rent must be greater than 0"),
    securityDeposit: z
      .number()
      .min(0, "Security deposit must be 0 or more"),
  })
  .refine((data) => new Date(data.endDate) > new Date(data.startDate), {
    message: "End date must be after start date",
    path: ["endDate"],
  });

export const leaseFilterSchema = z.object({
  status: z.nativeEnum(LeaseStatus).optional(),
  propertyId: z.string().uuid().optional(),
  tenantId: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(200).default(20),
});

export type CreateLeaseInput = z.infer<typeof createLeaseSchema>;
export type UpdateLeaseStatusInput = z.infer<typeof updateLeaseStatusSchema>;
export type RenewLeaseInput = z.infer<typeof renewLeaseSchema>;
export type LeaseFilterInput = z.infer<typeof leaseFilterSchema>;
