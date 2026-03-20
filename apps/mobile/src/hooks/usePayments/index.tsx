import api from '@/services/api'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PaymentStatus } from '@leaselink/shared'

export interface PaymentDTO {
	id: string
	leaseId: string
	tenantId: string
	amount: number
	dueDate: string
	status: string
	paidAt?: string | null
	createdAt: string
	updatedAt: string
}

interface PaymentsResponse {
	payments: PaymentDTO[]
	total: number
}

interface CheckoutSessionResponse {
	url: string
}

const PAGE_SIZE = 10

export const useMyPayments = (filters?: { status?: string }) => {
	return useInfiniteQuery({
		queryKey: ['payments', 'tenant', filters],
		initialPageParam: 1,
		queryFn: async ({ pageParam = 1 }) => {
			const response = await api.get<PaymentsResponse>('/payments/tenant', {
				params: {
					status: filters?.status,
					page: pageParam,
					pageSize: PAGE_SIZE,
				},
			})
			return response.data
		},
		getNextPageParam: (lastPage, allPages) => {
			if (!lastPage?.payments) return undefined
			if (lastPage.payments.length < PAGE_SIZE) return undefined
			return allPages.length + 1
		},
	})
}

export const usePayment = (id: string) => {
	return useQuery({
		queryKey: ['payments', id],
		queryFn: async () => {
			const response = await api.get<{ payment: PaymentDTO }>(`/payments/${id}`)
			return response.data.payment
		},
		enabled: !!id,
	})
}

export const useCreateCheckoutSession = () => {
	return useMutation({
		mutationFn: async (paymentId: string) => {
			const response = await api.post<CheckoutSessionResponse>(
				`/payments/${paymentId}/checkout`,
			)
			return response.data
		},
	})
}

export const useVerifyPayment = () => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (paymentId: string) => {
			const response = await api.post<{ status: string; updated: boolean }>(
				`/payments/${paymentId}/verify`,
			)
			return response.data
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['payments'] })
		},
	})
}

export const useNextPaymentDue = () => {
	const { data, isLoading } = useMyPayments()

	const allPayments =
		data?.pages.flatMap((page) => page.payments || []) || []

	const nextPayment = allPayments.find(
		(p) =>
			p.status === PaymentStatus.PENDING || p.status === PaymentStatus.OVERDUE,
	)

	return { nextPayment, isLoading }
}
