import { Either, right } from '@/core/either'
import type { SignatureRepository } from '@/domain/signature/application/repositories/signature-repository'
import type { Signature } from '@/domain/signature/enterprise/entities/signature'

export class InMemorySignatureRepository implements SignatureRepository {
	public items: Signature[] = []

	async getByDocumentId(documentId: string): Promise<Signature | null> {
		const signature = this.items.find(
			(s) => s.documentId.toString() === documentId,
		)
		return Promise.resolve(signature ?? null)
	}

	async create(signature: Signature): Promise<Either<Error, Signature>> {
		this.items.push(signature)
		return Promise.resolve(right(signature))
	}
}
