import {
  MaintenancePriority,
  MaintenanceStatus,
  MaintenanceCategory,
} from "../enums";

export interface MaintenanceRequest {
  id: string;
  propertyId: string;
  tenantId: string;
  title: string;
  description: string;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  category: MaintenanceCategory;
  photos: string[];
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string | null;
}
