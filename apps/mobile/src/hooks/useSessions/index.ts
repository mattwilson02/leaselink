/**
 * Hook for managing active sessions.
 *
 * API contract (verified from get-sessions.controller.ts):
 * GET /sessions → 200
 * {
 *   sessions: [
 *     {
 *       id: string,
 *       createdAt: string,        // ISO date string
 *       ipAddress: string | null,
 *       userAgent: string | null,
 *       isCurrent: boolean,
 *     }
 *   ]
 * }
 *
 * DELETE /sessions/:id → 204 (no body)
 * DELETE /sessions/:id → 400 { message: "Cannot revoke current session" }
 * DELETE /sessions/:id → 404 { message: "Session not found" }
 */

import api from '@/services/api'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export interface SessionDTO {
	id: string
	createdAt: string
	ipAddress: string | null
	userAgent: string | null
	isCurrent: boolean
}

interface GetSessionsResponse {
	sessions: SessionDTO[]
}

export const SESSIONS_QUERY_KEY = ['sessions']

export const useSessions = () => {
	const { data, isLoading, isError, refetch } = useQuery({
		queryKey: SESSIONS_QUERY_KEY,
		queryFn: async () => {
			const response = await api.get<GetSessionsResponse>('/sessions')
			return response.data
		},
		retry: false,
	})

	return {
		sessions: data?.sessions ?? [],
		isLoading,
		isError,
		refetch,
	}
}

export const useRevokeSession = () => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (sessionId: string) => {
			await api.delete(`/sessions/${sessionId}`)
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: SESSIONS_QUERY_KEY })
		},
	})
}
