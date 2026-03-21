import { AuditAction, AuditResourceType } from "../enums";

export interface AuditLog {
  id: string;
  actorId: string;
  actorType: string;
  action: AuditAction;
  resourceType: AuditResourceType;
  resourceId: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}
