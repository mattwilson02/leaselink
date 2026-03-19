import type { Client } from '@/domain/financial-management/enterprise/entities/client'

export abstract class ClientsRepository {
	abstract create(client: Client): Promise<void>
	abstract findByEmail(email: string): Promise<Client | null>
	abstract findById(clientId: string): Promise<Client | null>
	abstract update(client: Client): Promise<Client>
	abstract delete(clientId: string): Promise<void>
}
