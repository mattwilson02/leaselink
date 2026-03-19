import axios from 'axios'
import type { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios'
import { authClient } from './auth'

/**
 * Subset of AxiosRequestConfig
 */
export type RequestConfig<TData = unknown> = {
	url?: string
	method: 'GET' | 'PUT' | 'PATCH' | 'POST' | 'DELETE'
	params?: unknown
	data?: TData
	responseType?:
		| 'arraybuffer'
		| 'blob'
		| 'document'
		| 'json'
		| 'text'
		| 'stream'
	signal?: AbortSignal
	headers?: AxiosRequestConfig['headers']
}
/**
 * Subset of AxiosResponse
 */
export type ResponseConfig<TData = unknown> = {
	data: TData
	status: number
	statusText: string
	headers?: AxiosResponse['headers']
}

export type ResponseErrorConfig<TError = unknown> = {
	data: TError
	status?: number
	message: string
	code?: string
	request?: RequestConfig
	response?: ResponseConfig
}

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3333'

const api = axios.create({
	baseURL: API_URL,
})

api.interceptors.request.use(async (config) => {
	const token = await authClient.getSession()

	if (token) {
		config.headers.Authorization = `Bearer ${token.data?.session.token}`
	}

	return config
})

export const client = async <TData, TError = unknown, TVariables = unknown>(
	config: RequestConfig<TVariables>,
): Promise<ResponseConfig<TData>> => {
	const promise = api
		.request<TVariables, ResponseConfig<TData>>({ ...config })
		.catch((e: AxiosError<TError>) => {
			throw e
		})

	return promise
}

export default api
