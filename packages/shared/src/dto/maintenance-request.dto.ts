import {
  MaintenancePriority,
  MaintenanceStatus,
  MaintenanceCategory,
} from "../enums";

export interface CreateMaintenanceRequestDto {
  propertyId: string;
  title: string;
  description: string;
  category: MaintenanceCategory;
  priority?: MaintenancePriority;
}

export interface UpdateMaintenanceRequestDto {
  status?: MaintenanceStatus;
  title?: string;
  description?: string;
  priority?: MaintenancePriority;
}

export interface MaintenanceRequestFilterDto {
  status?: MaintenanceStatus;
  priority?: MaintenancePriority;
  category?: MaintenanceCategory;
  propertyId?: string;
  page?: number;
  pageSize?: number;
}
