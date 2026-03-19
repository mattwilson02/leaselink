import api from '@/services/api'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { MaintenanceStatus } from '@leaselink/shared'
import * as ImagePicker from 'expo-image-picker'

export interface MaintenanceRequestDTO {
	id: string
	propertyId: string
	tenantId: string
	title: string
	description: string
	category: string
	priority: string
	status: string
	photoUrls?: string[]
	createdAt: string
	updatedAt: string
	resolvedAt?: string | null
}

interface MaintenanceRequestsResponse {
	maintenanceRequests: MaintenanceRequestDTO[]
	total: number
}

interface CreateMaintenanceRequestInput {
	propertyId: string
	title: string
	description: string
	category: string
	priority: string
	photos?: ImagePicker.ImagePickerAsset[]
}

interface UploadUrlItem {
	blobKey: string
	uploadUrl: string
}

const PAGE_SIZE = 10

export const useMyMaintenanceRequests = (filters?: { status?: string }) => {
	return useInfiniteQuery({
		queryKey: ['maintenanceRequests', 'tenant', filters],
		initialPageParam: 1,
		queryFn: async ({ pageParam = 1 }) => {
			const response = await api.get<MaintenanceRequestsResponse>(
				'/maintenance-requests/tenant',
				{
					params: {
						status: filters?.status,
						page: pageParam,
						pageSize: PAGE_SIZE,
					},
				},
			)
			return response.data
		},
		getNextPageParam: (lastPage, allPages) => {
			if (!lastPage?.maintenanceRequests) return undefined
			if (lastPage.maintenanceRequests.length < PAGE_SIZE) return undefined
			return allPages.length + 1
		},
	})
}

export const useMaintenanceRequest = (id: string) => {
	return useQuery({
		queryKey: ['maintenanceRequests', id],
		queryFn: async () => {
			const response = await api.get<{ maintenanceRequest: MaintenanceRequestDTO }>(
				`/maintenance-requests/${id}`,
			)
			return response.data.maintenanceRequest
		},
		enabled: !!id,
	})
}

export const useCreateMaintenanceRequest = () => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (input: CreateMaintenanceRequestInput) => {
			// Step 1: Create the maintenance request
			const createResponse = await api.post<{ maintenanceRequest: MaintenanceRequestDTO }>(
				'/maintenance-requests',
				{
					propertyId: input.propertyId,
					title: input.title,
					description: input.description,
					category: input.category,
					priority: input.priority,
				},
			)

			const maintenanceRequest = createResponse.data.maintenanceRequest

			// Step 2: Upload photos if any
			if (input.photos && input.photos.length > 0) {
				const files = input.photos.map((photo) => ({
					fileName: photo.fileName || `photo_${Date.now()}.jpg`,
					contentType: photo.mimeType || 'image/jpeg',
				}))

				const uploadUrlsResponse = await api.post<{ uploadUrls: UploadUrlItem[] }>(
					`/maintenance-requests/${maintenanceRequest.id}/photos`,
					{ files },
				)

				const uploadUrls = uploadUrlsResponse.data.uploadUrls

				// Step 3: Upload each photo directly to blob storage
				await Promise.all(
					uploadUrls.map(async (uploadItem, index) => {
						const photo = input.photos![index]
						const fileResponse = await fetch(photo.uri)
						const fileBlob = await fileResponse.blob()

						// TODO: replace blob storage hostname for dev environment
						const mobileAccessibleUrl = uploadItem.uploadUrl.replace(
							'backend-blob-storage',
							'localhost',
						)

						await fetch(mobileAccessibleUrl, {
							method: 'PUT',
							body: fileBlob,
							headers: {
								'Content-Type': photo.mimeType || 'image/jpeg',
								'x-ms-blob-type': 'BlockBlob',
							},
						})

						return uploadItem.blobKey
					}),
				)

				// Step 4: Confirm photo upload
				const blobKeys = uploadUrls.map((item) => item.blobKey)
				await api.post(`/maintenance-requests/${maintenanceRequest.id}/photos/confirm`, {
					blobKeys,
				})
			}

			return maintenanceRequest
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['maintenanceRequests'] })
		},
	})
}

export const useCloseMaintenanceRequest = () => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (id: string) => {
			const response = await api.patch<{ maintenanceRequest: MaintenanceRequestDTO }>(
				`/maintenance-requests/${id}/status`,
				{ status: 'CLOSED' as MaintenanceStatus },
			)
			return response.data.maintenanceRequest
		},
		onSuccess: (_data, id) => {
			queryClient.invalidateQueries({ queryKey: ['maintenanceRequests', id] })
			queryClient.invalidateQueries({ queryKey: ['maintenanceRequests', 'tenant'] })
		},
	})
}
