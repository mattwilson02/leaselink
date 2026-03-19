import type { UniqueEntityId } from '@/core/entities/unique-entity-id'
import {
	Client,
	ClientProps,
} from '@/domain/financial-management/enterprise/entities/client'
import { ClientStatus } from '@/domain/financial-management/enterprise/entities/value-objects/client-status'
import { PrismaClientMapper } from '@/infra/database/prisma/mappers/prisma-client-mapper'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { faker } from '@faker-js/faker'
import { Injectable } from '@nestjs/common'

export const makeClient = (
	override: Partial<ClientProps> = {},
	id?: UniqueEntityId,
) => {
	const newClient = Client.create(
		{
			name: faker.person.fullName(),
			email: faker.internet.email(),
			phoneNumber: `+44${faker.string.numeric(10)}`,
			status: ClientStatus.create('INVITED'),
			...override,
		},
		id,
	)

	return newClient
}

@Injectable()
export class ClientFactory {
	constructor(private prisma: PrismaService) {}

	async makePrismaClient(data: Partial<ClientProps> = {}): Promise<Client> {
		const client = makeClient(data)
		await this.prisma.client.create({
			data: PrismaClientMapper.toPrisma(client),
		})
		return client
	}
}
