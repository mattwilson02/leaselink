// Controller shapes (verified against backend source):
//
// POST /documents/:id/sign/upload
//   returns: { uploadUrl: string, blobName: string }
//
// POST /documents/:id/sign  body: { signatureImageKey: string }
//   returns: { signature: SignatureDTO }
//
// GET /documents/:id/signature
//   returns: { signature: SignatureDTO } or 404 (unsigned, treat as null)
//
// SignatureDTO (from HttpSignaturePresenter.toHTTP):
//   id: string
//   documentId: string
//   signedBy: string       — clientId
//   signatureImageKey: string
//   ipAddress: string | null
//   userAgent: string | null
//   signedAt: string       — ISO date string

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/services/api'
import type { AxiosError } from 'axios'

export interface SignatureDTO {
	id: string
	documentId: string
	signedBy: string
	signatureImageKey: string
	ipAddress: string | null
	userAgent: string | null
	signedAt: string
}

interface GenerateUploadUrlResponse {
	uploadUrl: string
	blobName: string
}

interface SignDocumentResponse {
	signature: SignatureDTO
}

interface GetSignatureResponse {
	signature: SignatureDTO
}

export const signatureQueryKey = (documentId: string) => [
	'signature',
	documentId,
]

export function useUploadSignatureImage(documentId: string) {
	return useMutation<GenerateUploadUrlResponse, AxiosError>({
		mutationFn: async () => {
			const response = await api.post<GenerateUploadUrlResponse>(
				`/documents/${documentId}/sign/upload`,
			)
			return response.data
		},
	})
}

export function useSignDocument(documentId: string) {
	const queryClient = useQueryClient()

	return useMutation<
		SignDocumentResponse,
		AxiosError,
		{ signatureImageKey: string }
	>({
		mutationFn: async ({ signatureImageKey }) => {
			const response = await api.post<SignDocumentResponse>(
				`/documents/${documentId}/sign`,
				{ signatureImageKey },
			)
			return response.data
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: [{ url: `/documents/${documentId}`, params: { documentId } }],
			})
			queryClient.invalidateQueries({
				queryKey: signatureQueryKey(documentId),
			})
		},
	})
}

export function useSignatureQuery(documentId: string) {
	return useQuery<SignatureDTO | null>({
		queryKey: signatureQueryKey(documentId),
		queryFn: async () => {
			try {
				const response = await api.get<GetSignatureResponse>(
					`/documents/${documentId}/signature`,
				)
				return response.data.signature
			} catch (error) {
				const axiosError = error as AxiosError
				if (axiosError.response?.status === 404) {
					// 404 means unsigned — not an error
					return null
				}
				throw error
			}
		},
		enabled: !!documentId,
		retry: (failureCount, error) => {
			const axiosError = error as AxiosError
			if (axiosError.response?.status === 404) return false
			return failureCount < 2
		},
	})
}
