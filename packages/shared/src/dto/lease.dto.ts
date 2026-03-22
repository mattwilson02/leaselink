import { LeaseStatus } from "../enums";

export interface CreateLeaseDto {
  propertyId: string;
  tenantId: string;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  securityDeposit: number;
  earlyTerminationFee?: number | null;
}

export interface UpdateLeaseStatusDto {
  status: LeaseStatus;
}

export interface RenewLeaseDto {
  startDate: string;
  endDate: string;
  monthlyRent: number;
  securityDeposit: number;
}

export interface LeaseFilterDto {
  status?: LeaseStatus;
  propertyId?: string;
  tenantId?: string;
  page?: number;
  pageSize?: number;
}
