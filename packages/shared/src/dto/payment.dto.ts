import { PaymentStatus } from "../enums";

export interface CreateCheckoutSessionDto {
  paymentId: string;
}

export interface PaymentFilterDto {
  status?: PaymentStatus;
  leaseId?: string;
  tenantId?: string;
  page?: number;
  pageSize?: number;
}
