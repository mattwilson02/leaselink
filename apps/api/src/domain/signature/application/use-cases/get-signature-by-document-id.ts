import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { Signature } from '../../enterprise/entities/signature'
import { SignatureRepository } from '../repositories/signature-repository'
import { SignatureNotFoundError } from './errors/signature-not-found-error'

export interface GetSignatureByDocumentIdUseCaseRequest {
	documentId: string
}

type GetSignatureByDocumentIdUseCaseResponse = Either<
	SignatureNotFoundError,
	{ signature: Signature }
>

@Injectable()
export class GetSignatureByDocumentIdUseCase {
	constructor(private signatureRepository: SignatureRepository) {}

	async execute({
		documentId,
	}: GetSignatureByDocumentIdUseCaseRequest): Promise<GetSignatureByDocumentIdUseCaseResponse> {
		const signature = await this.signatureRepository.getByDocumentId(documentId)

		if (!signature) {
			return left(new SignatureNotFoundError(documentId))
		}

		return right({ signature })
	}
}
