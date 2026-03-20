import api from '@/services/api'
import { useQuery } from '@tanstack/react-query'
import { LeaseStatus, type PropertyType } from '@leaselink/shared'

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
	data: LeaseWithProperty[]
}

export const useMyLeases = () => {
	const { data, isLoading, isError } = useQuery({
		queryKey: ['leases', 'tenant'],
		queryFn: async () => {
			const response = await api.get<TenantLeasesResponse>('/leases/tenant')
			return response.data
		},
		retry: false,
	})

	return { leases: data?.data ?? [], isLoading, isError }
}

export const useMyActiveLease = () => {
	const { leases, isLoading, isError } = useMyLeases()

	const activeLease = leases.find((l) => l.status === LeaseStatus.ACTIVE)

	return { activeLease: activeLease ?? null, isLoading, isError }
}
