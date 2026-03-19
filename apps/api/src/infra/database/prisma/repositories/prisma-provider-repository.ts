import type { IdentityProviderRepository } from '@/domain/authentication/application/repositories/identity-provider-repository'
import type { IdentityProvider } from '@/domain/authentication/enterprise/entities/identity-provider'
import { Injectable } from '@nestjs/common'
import { PrismaProviderMapper } from '../mappers/prisma-provider-mapper'
import { PrismaService } from '../prisma.service'

@Injectable()
export class PrismaIdentityProviderRepository
	implements IdentityProviderRepository
{
	constructor(private prisma: PrismaService) {}
	async findByProviderId(
		providerUserId: string,
	): Promise<IdentityProvider | null> {
		const identityProvider = await this.prisma.identityProvider.findUnique({
			where: {
				providerUserId: providerUserId,
			},
		})
		if (!identityProvider) {
			return null
		}
		return PrismaProviderMapper.toDomain(identityProvider)
	}

	async findByClientId(clientId: string): Promise<IdentityProvider | null> {
		const identityProvider = await this.prisma.identityProvider.findFirst({
			where: {
				userId: clientId,
			},
		})
		if (!identityProvider) {
			return null
		}
		return PrismaProviderMapper.toDomain(identityProvider)
	}

	async delete(identityProviderId: string): Promise<void> {
		await this.prisma.identityProvider.delete({
			where: {
				id: identityProviderId,
			},
		})
	}

	async create(
		identityProvider: IdentityProvider,
	): Promise<IdentityProvider | null> {
		const createdIdentityProvider = await this.prisma.identityProvider.create({
			data: PrismaProviderMapper.toPrisma(identityProvider),
		})
		return PrismaProviderMapper.toDomain(createdIdentityProvider)
	}
}
