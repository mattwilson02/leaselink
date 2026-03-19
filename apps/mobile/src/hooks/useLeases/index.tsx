import api from '@/services/api'
import { useQuery } from '@tanstack/react-query'
import { LeaseStatus, PropertyType } from '@leaselink/shared'

export interface LeaseDTO {
	id: string
	propertyId: string
	tenantId: string
	startDate: string
	endDate: string
	monthlyRent: number
	securityDeposit: number
	status: string
	renewedFromLeaseId: string | null
	createdAt: string
	updatedAt: string | null
}

export interface PropertyDTO {
	id: string
	address: string
	city: string
	state: string
	zipCode: string
	propertyType: PropertyType
}

export interface LeaseWithProperty extends LeaseDTO {
	property?: PropertyDTO
}

interface TenantLeasesResponse {
	leases: LeaseWithProperty[]
}

export const useMyActiveLease = () => {
	const { data, isLoading, isError } = useQuery({
		queryKey: ['leases', 'tenant'],
		queryFn: async () => {
			const response = await api.get<TenantLeasesResponse>('/leases/tenant')
			return response.data
		},
		retry: false,
	})

	const activeLease = data?.leases?.find(
		(l) => l.status === LeaseStatus.ACTIVE,
	)

	return { activeLease: activeLease ?? null, isLoading, isError }
}
