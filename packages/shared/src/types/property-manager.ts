import { ManagerRole } from "../enums";

export interface PropertyManager {
  id: string;
  email: string;
  name: string;
  role: ManagerRole;
  deviceId: string | null;
  createdAt: string;
  updatedAt: string | null;
}
