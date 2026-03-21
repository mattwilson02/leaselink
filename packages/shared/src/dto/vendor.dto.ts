import { MaintenanceCategory } from "../enums";

export interface CreateVendorDto {
  name: string;
  specialty: MaintenanceCategory;
  phone?: string;
  email?: string;
  notes?: string;
}

export interface UpdateVendorDto {
  name?: string;
  specialty?: MaintenanceCategory;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
}

export interface VendorFilterDto {
  specialty?: MaintenanceCategory;
  search?: string;
  page: number;
  pageSize: number;
}
