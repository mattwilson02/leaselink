import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { InMemorySignatureRepository } from 'test/repositories/prisma/in-memory-signature-repository'
import { GetSignatureByDocumentIdUseCase } from './get-signature-by-document-id'
import { Signature } from '../../enterprise/entities/signature'
import { SignatureNotFoundError } from './errors/signature-not-found-error'

let inMemorySignatureRepository: InMemorySignatureRepository
let sut: GetSignatureByDocumentIdUseCase

describe('GetSignatureByDocumentIdUseCase', () => {
	beforeEach(() => {
		inMemorySignatureRepository = new InMemorySignatureRepository()
		sut = new GetSignatureByDocumentIdUseCase(inMemorySignatureRepository)
	})

	it('should return the signature for a document', async () => {
		const documentId = new UniqueEntityId('doc-1')
		const signature = Signature.create({
			documentId,
			signedBy: new UniqueEntityId('client-1'),
			signatureImageKey: 'signatures/doc-1/sig.png',
			ipAddress: '127.0.0.1',
			userAgent: 'TestAgent/1.0',
		})
		await inMemorySignatureRepository.create(signature)

		const result = await sut.execute({ documentId: 'doc-1' })

		expect(result.isRight()).toBeTruthy()
		if (result.isRight()) {
			expect(result.value.signature.documentId.toString()).toBe('doc-1')
			expect(result.value.signature.signatureImageKey).toBe(
				'signatures/doc-1/sig.png',
			)
		}
	})

	it('should return SignatureNotFoundError when no signature exists', async () => {
		const result = await sut.execute({ documentId: 'non-existent-doc' })

		expect(result.isLeft()).toBeTruthy()
		expect(result.value).toBeInstanceOf(SignatureNotFoundError)
	})
})
