import { PaymentStatus } from "../enums";

export interface Payment {
  id: string;
  leaseId: string;
  tenantId: string;
  amount: number;
  dueDate: string;
  status: PaymentStatus;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string | null;
}
