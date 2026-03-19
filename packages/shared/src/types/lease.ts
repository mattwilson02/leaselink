import { LeaseStatus } from "../enums";

export interface Lease {
  id: string;
  propertyId: string;
  tenantId: string;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  securityDeposit: number;
  status: LeaseStatus;
  renewedFromLeaseId: string | null;
  createdAt: string;
  updatedAt: string | null;
}
