import { Lease } from '@/domain/lease-management/enterprise/entities/lease'

export interface LeaseHttpResponse {
	id: string
	propertyId: string
	tenantId: string
	startDate: string
	endDate: string
	monthlyRent: number
	securityDeposit: number
	earlyTerminationFee: number | null
	status: string
	renewedFromLeaseId: string | null
	createdAt: string
	updatedAt: string | null
}

export class HttpLeasePresenter {
	static toHTTP(lease: Lease): LeaseHttpResponse {
		return {
			id: lease.id.toString(),
			propertyId: lease.propertyId.toString(),
			tenantId: lease.tenantId.toString(),
			startDate: lease.startDate.toISOString(),
			endDate: lease.endDate.toISOString(),
			monthlyRent: lease.monthlyRent,
			securityDeposit: lease.securityDeposit,
			earlyTerminationFee: lease.earlyTerminationFee,
			status: lease.status,
			renewedFromLeaseId: lease.renewedFromLeaseId?.toString() ?? null,
			createdAt: lease.createdAt.toISOString(),
			updatedAt: lease.updatedAt ? lease.updatedAt.toISOString() : null,
		}
	}

	static toHTTPList(leases: Lease[]): LeaseHttpResponse[] {
		return leases.map(HttpLeasePresenter.toHTTP)
	}
}
