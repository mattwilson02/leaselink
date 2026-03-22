import { z } from "zod";
import { AuditAction, AuditResourceType } from "../enums";

export const auditLogFilterSchema = z.object({
  resourceType: z.nativeEnum(AuditResourceType).optional(),
  resourceId: z.string().uuid().optional(),
  action: z.nativeEnum(AuditAction).optional(),
  actorId: z.string().uuid().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export type AuditLogFilterInput = z.infer<typeof auditLogFilterSchema>;
