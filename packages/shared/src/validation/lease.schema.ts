import { z } from "zod";
import { LeaseStatus } from "../enums";
import {
  MIN_LEASE_DURATION_DAYS,
  MAX_LEASE_DURATION_DAYS,
} from "../constants/lease";

// Accepts both YYYY-MM-DD (from HTML date inputs) and full ISO datetime strings
const dateString = (label: string) =>
  z.string().refine((val) => !Number.isNaN(Date.parse(val)), {
    message: `Invalid ${label}`,
  });

const MS_PER_DAY = 1000 * 60 * 60 * 24;

const createLeaseBaseSchema = z.object({
  propertyId: z.string().uuid("Invalid property ID"),
  tenantId: z.string().uuid("Invalid tenant ID"),
  startDate: dateString("start date"),
  endDate: dateString("end date"),
  monthlyRent: z.number().positive("Monthly rent must be greater than 0"),
  securityDeposit: z.number().min(0, "Security deposit must be 0 or more"),
  earlyTerminationFee: z.number().min(0).optional(),
});

export const createLeaseSchema = createLeaseBaseSchema
  .refine((data) => new Date(data.endDate) > new Date(data.startDate), {
    message: "End date must be after start date",
    path: ["endDate"],
  })
  .refine(
    (data) => {
      const diffMs =
        new Date(data.endDate).getTime() - new Date(data.startDate).getTime();
      return diffMs >= MIN_LEASE_DURATION_DAYS * MS_PER_DAY;
    },
    {
      message: `Lease duration must be at least ${MIN_LEASE_DURATION_DAYS} days`,
      path: ["endDate"],
    },
  )
  .refine(
    (data) => {
      const diffMs =
        new Date(data.endDate).getTime() - new Date(data.startDate).getTime();
      return diffMs <= MAX_LEASE_DURATION_DAYS * MS_PER_DAY;
    },
    {
      message: "Lease duration cannot exceed 5 years",
      path: ["endDate"],
    },
  );

export const updateLeaseStatusSchema = z.object({
  status: z.nativeEnum(LeaseStatus),
});

const renewLeaseBaseSchema = z.object({
  startDate: dateString("start date"),
  endDate: dateString("end date"),
  monthlyRent: z.number().positive("Monthly rent must be greater than 0"),
  securityDeposit: z.number().min(0, "Security deposit must be 0 or more"),
});

export const renewLeaseSchema = renewLeaseBaseSchema
  .refine((data) => new Date(data.endDate) > new Date(data.startDate), {
    message: "End date must be after start date",
    path: ["endDate"],
  })
  .refine(
    (data) => {
      const diffMs =
        new Date(data.endDate).getTime() - new Date(data.startDate).getTime();
      return diffMs >= MIN_LEASE_DURATION_DAYS * MS_PER_DAY;
    },
    {
      message: `Lease duration must be at least ${MIN_LEASE_DURATION_DAYS} days`,
      path: ["endDate"],
    },
  )
  .refine(
    (data) => {
      const diffMs =
        new Date(data.endDate).getTime() - new Date(data.startDate).getTime();
      return diffMs <= MAX_LEASE_DURATION_DAYS * MS_PER_DAY;
    },
    {
      message: "Lease duration cannot exceed 5 years",
      path: ["endDate"],
    },
  );

export const leaseFilterSchema = z.object({
  status: z.enum(['PENDING', 'ACTIVE', 'EXPIRED', 'TERMINATED']).optional(),
  propertyId: z.string().uuid().optional(),
  tenantId: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(200).default(20),
});

export type CreateLeaseInput = z.infer<typeof createLeaseSchema>;
export type UpdateLeaseStatusInput = z.infer<typeof updateLeaseStatusSchema>;
export type RenewLeaseInput = z.infer<typeof renewLeaseSchema>;
export type LeaseFilterInput = z.infer<typeof leaseFilterSchema>;
