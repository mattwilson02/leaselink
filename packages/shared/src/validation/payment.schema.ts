import { z } from "zod";
import { PaymentStatus } from "../enums";

export const createCheckoutSessionSchema = z.object({
  paymentId: z.string().uuid("Invalid payment ID"),
});

export const paymentFilterSchema = z.object({
  status: z.nativeEnum(PaymentStatus).optional(),
  leaseId: z.string().uuid().optional(),
  tenantId: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(200).default(20),
});

export type CreateCheckoutSessionInput = z.infer<
  typeof createCheckoutSessionSchema
>;
export type PaymentFilterInput = z.infer<typeof paymentFilterSchema>;
