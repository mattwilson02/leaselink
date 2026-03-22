import { MaintenanceCategory } from "../enums";

export interface Vendor {
  id: string;
  managerId: string;
  name: string;
  specialty: MaintenanceCategory;
  phone: string | null;
  email: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string | null;
}
