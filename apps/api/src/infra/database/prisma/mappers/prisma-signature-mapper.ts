import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { Signature } from '@/domain/signature/enterprise/entities/signature'
import type { Prisma, Signature as PrismaSignature } from '@prisma/client'

export class PrismaSignatureMapper {
	static toDomain(raw: PrismaSignature): Signature {
		return Signature.create(
			{
				documentId: new UniqueEntityId(raw.documentId),
				signedBy: new UniqueEntityId(raw.signedBy),
				signatureImageKey: raw.signatureImageKey,
				ipAddress: raw.ipAddress ?? null,
				userAgent: raw.userAgent ?? null,
				signedAt: raw.signedAt,
			},
			new UniqueEntityId(raw.id),
		)
	}

	static toPrisma(signature: Signature): Prisma.SignatureUncheckedCreateInput {
		return {
			id: signature.id.toString(),
			documentId: signature.documentId.toString(),
			signedBy: signature.signedBy.toString(),
			signatureImageKey: signature.signatureImageKey,
			ipAddress: signature.ipAddress ?? null,
			userAgent: signature.userAgent ?? null,
			signedAt: signature.signedAt,
		}
	}
}
