import type { Client } from '@/domain/financial-management/enterprise/entities/client'

export interface ClientsFilterParams {
	status?: string
	onboardingStatus?: string
	search?: string
	page: number
	pageSize: number
}

export interface ClientsPaginatedResult {
	clients: Client[]
	totalCount: number
}

export abstract class ClientsRepository {
	abstract create(client: Client): Promise<void>
	abstract findByEmail(email: string): Promise<Client | null>
	abstract findById(clientId: string): Promise<Client | null>
	abstract findMany(
		params: ClientsFilterParams,
	): Promise<ClientsPaginatedResult>
	abstract update(client: Client): Promise<Client>
	abstract delete(clientId: string): Promise<void>
}
