import { PaymentStatus } from "../enums";

export interface Payment {
  id: string;
  leaseId: string;
  tenantId: string;
  amount: number;
  dueDate: string;
  status: PaymentStatus;
  stripeCheckoutSessionId: string | null;
  stripePaymentIntentId: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string | null;
}
