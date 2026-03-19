import type {
	ClientsRepository,
	ClientsFilterParams,
	ClientsPaginatedResult,
} from '@/domain/financial-management/application/repositories/clients-repository'
import type { Client } from '@/domain/financial-management/enterprise/entities/client'
import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaClientMapper } from '../mappers/prisma-client-mapper'
import { PrismaService } from '../prisma.service'

@Injectable()
export class PrismaClientsRepository implements ClientsRepository {
	constructor(private prisma: PrismaService) {}

	async create(client: Client): Promise<void> {
		const data = PrismaClientMapper.toPrisma(client)

		await this.prisma.client.create({
			data,
		})
	}

	async findById(clientId: string): Promise<Client | null> {
		const client = await this.prisma.client.findUnique({
			where: {
				id: clientId,
			},
		})

		if (!client) {
			return null
		}

		return PrismaClientMapper.toDomain(client)
	}

	async findByEmail(email: string): Promise<Client | null> {
		const client = await this.prisma.client.findUnique({
			where: {
				email,
			},
		})

		if (!client) {
			return null
		}

		return PrismaClientMapper.toDomain(client)
	}

	async delete(clientId: string): Promise<void> {
		await this.prisma.client.delete({
			where: {
				id: clientId,
			},
		})
	}

	async findMany(params: ClientsFilterParams): Promise<ClientsPaginatedResult> {
		const where: Prisma.ClientWhereInput = {}

		if (params.status) {
			where.status = params.status as any
		}

		if (params.onboardingStatus) {
			where.onboardingStatus = params.onboardingStatus as any
		}

		if (params.search) {
			where.OR = [
				{ name: { contains: params.search, mode: 'insensitive' } },
				{ email: { contains: params.search, mode: 'insensitive' } },
			]
		}

		const [clients, totalCount] = await Promise.all([
			this.prisma.client.findMany({
				where,
				orderBy: { createdAt: 'desc' },
				skip: (params.page - 1) * params.pageSize,
				take: params.pageSize,
			}),
			this.prisma.client.count({ where }),
		])

		return {
			clients: clients.map(PrismaClientMapper.toDomain),
			totalCount,
		}
	}

	async update(client: Client): Promise<Client> {
		const data = PrismaClientMapper.toPrisma(client)

		const updatedClient = await this.prisma.client.update({
			where: {
				id: client.id.toString(),
			},
			data,
		})

		return PrismaClientMapper.toDomain(updatedClient)
	}
}
