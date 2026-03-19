import type {
	ClientsRepository,
	ClientsFilterParams,
	ClientsPaginatedResult,
} from '@/domain/financial-management/application/repositories/clients-repository'
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

	async findMany(params: ClientsFilterParams): Promise<ClientsPaginatedResult> {
		let filtered = [...this.items]

		if (params.status) {
			filtered = filtered.filter((c) => c.status === params.status)
		}

		if (params.onboardingStatus) {
			filtered = filtered.filter(
				(c) => c.onboardingStatus === params.onboardingStatus,
			)
		}

		if (params.search) {
			const search = params.search.toLowerCase()
			filtered = filtered.filter(
				(c) =>
					c.name.toLowerCase().includes(search) ||
					c.email.toLowerCase().includes(search),
			)
		}

		const totalCount = filtered.length
		const start = (params.page - 1) * params.pageSize
		const paginated = filtered.slice(start, start + params.pageSize)

		return { clients: paginated, totalCount }
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
