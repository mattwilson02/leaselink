import type { ClientsRepository } from '@/domain/financial-management/application/repositories/clients-repository'
import type { Client } from '@/domain/financial-management/enterprise/entities/client'

export class InMemoryClientsRepository implements ClientsRepository {
	public items: Client[] = []

	async create(client: Client): Promise<void> {
		this.items.push(client)

		return Promise.resolve()
	}

	async findByEmail(email: string): Promise<Client | null> {
		const client = this.items.find((client) => client.email === email)

		return Promise.resolve(client ?? null)
	}

	async findById(clientId: string): Promise<Client | null> {
		const client = this.items.find(
			(client) => client.id.toString() === clientId,
		)

		return Promise.resolve(client ?? null)
	}

	async delete(clientId: string): Promise<void> {
		const clientIndex = this.items.findIndex(
			(client) => client.id.toString() === clientId,
		)

		if (clientIndex === -1) {
			return Promise.resolve()
		}

		this.items.splice(clientIndex, 1)

		return Promise.resolve()
	}

	async update(client: Client): Promise<Client> {
		const clientIndex = this.items.findIndex(
			(item) => item.id.toString() === client.id.toString(),
		)

		if (clientIndex === -1) {
			return Promise.resolve(client)
		}

		this.items[clientIndex] = client

		return Promise.resolve(client)
	}
}
