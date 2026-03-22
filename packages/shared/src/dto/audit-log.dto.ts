import { AuditAction, AuditResourceType } from "../enums";

export interface AuditLogFilterDto {
  resourceType?: AuditResourceType;
  resourceId?: string;
  action?: AuditAction;
  actorId?: string;
  dateFrom?: string;
  dateTo?: string;
  page: number;
  pageSize: number;
}
