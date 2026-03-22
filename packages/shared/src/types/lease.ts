import { LeaseStatus } from "../enums";

export interface Lease {
  id: string;
  propertyId: string;
  tenantId: string;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  securityDeposit: number;
  earlyTerminationFee: number | null;
  status: LeaseStatus;
  renewedFromLeaseId: string | null;
  createdAt: string;
  updatedAt: string | null;
}
