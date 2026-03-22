import type { Either } from '@/core/either'
import type { Signature } from '../../enterprise/entities/signature'

export abstract class SignatureRepository {
	abstract getByDocumentId(documentId: string): Promise<Signature | null>
	abstract create(signature: Signature): Promise<Either<Error, Signature>>
}
