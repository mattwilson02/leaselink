import { Either, left, right } from '@/core/either'
import { SignatureRepository } from '@/domain/signature/application/repositories/signature-repository'
import { Signature } from '@/domain/signature/enterprise/entities/signature'
import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import { PrismaSignatureMapper } from '../mappers/prisma-signature-mapper'

@Injectable()
export class PrismaSignatureRepository implements SignatureRepository {
	constructor(private prisma: PrismaService) {}

	async getByDocumentId(documentId: string): Promise<Signature | null> {
		const signature = await this.prisma.signature.findUnique({
			where: { documentId },
		})

		if (!signature) {
			return null
		}

		return PrismaSignatureMapper.toDomain(signature)
	}

	async create(signature: Signature): Promise<Either<Error, Signature>> {
		const data = PrismaSignatureMapper.toPrisma(signature)
		const created = await this.prisma.signature.create({ data })

		if (!created) {
			return left(new Error('Failed to create signature'))
		}

		return right(PrismaSignatureMapper.toDomain(created))
	}
}
