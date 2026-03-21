import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { right } from '@/core/either'
import { Document } from '@/domain/document/enterprise/entities/document'
import { DocumentFolder } from '@/domain/document/enterprise/entities/value-objects/document-folders'
import { DocumentNotFoundError } from '@/domain/document/application/use-cases/errors/document-not-found-error'
import { InMemoryDocumentRepository } from 'test/repositories/prisma/in-memory-document-repository'
import { InMemoryBlobStorageRepository } from 'test/repositories/prisma/in-memory-blob-storage-repository'
import { InMemorySignatureRepository } from 'test/repositories/prisma/in-memory-signature-repository'
import type { CreateAuditLogUseCase } from '@/domain/audit/application/use-cases/create-audit-log'
import type { CreateNotificationUseCase } from '@/domain/notification/application/use-cases/create-notification'
import { SignDocumentUseCase } from './sign-document'
import { DocumentNotSignableError } from './errors/document-not-signable-error'
import { DocumentAlreadySignedError } from './errors/document-already-signed-error'
import { SignatureImageNotFoundError } from './errors/signature-image-not-found-error'
import { Signature } from '../../enterprise/entities/signature'

class MockCreateAuditLogUseCase {
	calls: unknown[] = []
	async execute(input: unknown) {
		this.calls.push(input)
		return right({ auditLog: {} as any })
	}
}

class MockCreateNotificationUseCase {
	calls: unknown[] = []
	async execute(input: unknown) {
		this.calls.push(input)
		return right({ notification: {} as any })
	}
}

let inMemoryDocumentRepository: InMemoryDocumentRepository
let inMemorySignatureRepository: InMemorySignatureRepository
let inMemoryBlobStorageRepository: InMemoryBlobStorageRepository
let mockAuditLog: MockCreateAuditLogUseCase
let mockNotification: MockCreateNotificationUseCase
let sut: SignDocumentUseCase

const SIGNABLE_FOLDER = DocumentFolder.create('LEASE_AGREEMENTS')
const NON_SIGNABLE_FOLDER = DocumentFolder.create('IDENTIFICATION')
const BLOB_KEY = 'signatures/doc-1/sig.png'
const MANAGER_ID = new UniqueEntityId('manager-1')
const CLIENT_ID = new UniqueEntityId('client-1')
const SIGNER_ID = CLIENT_ID.toString()

function makeSignableDocument(
	overrides: { folder?: ReturnType<typeof DocumentFolder.create> } = {},
) {
	return Document.create({
		clientId: CLIENT_ID,
		contentKey: new UniqueEntityId(),
		version: 1,
		name: 'Lease Agreement.pdf',
		blobName: 'lease.pdf',
		fileSize: 1024,
		thumbnailBlobName: null,
		folder: overrides.folder ?? SIGNABLE_FOLDER,
		uploadedBy: MANAGER_ID,
	})
}

describe('SignDocumentUseCase', () => {
	beforeEach(() => {
		inMemoryDocumentRepository = new InMemoryDocumentRepository()
		inMemorySignatureRepository = new InMemorySignatureRepository()
		inMemoryBlobStorageRepository = new InMemoryBlobStorageRepository()
		mockAuditLog = new MockCreateAuditLogUseCase()
		mockNotification = new MockCreateNotificationUseCase()

		sut = new SignDocumentUseCase(
			inMemoryDocumentRepository,
			inMemorySignatureRepository,
			inMemoryBlobStorageRepository,
			mockAuditLog as unknown as CreateAuditLogUseCase,
			mockNotification as unknown as CreateNotificationUseCase,
		)
	})

	it('should sign a document successfully', async () => {
		const document = makeSignableDocument()
		await inMemoryDocumentRepository.create(document)

		inMemoryBlobStorageRepository.items.push({
			blobName: BLOB_KEY,
			uploadUrl: 'https://example.com/upload',
			size: 512,
			lastModified: new Date(),
			contentType: 'image/png',
		})

		const result = await sut.execute({
			documentId: document.id.toString(),
			signedBy: SIGNER_ID,
			signatureImageKey: BLOB_KEY,
			ipAddress: '127.0.0.1',
			userAgent: 'TestAgent/1.0',
		})

		expect(result.isRight()).toBeTruthy()
		if (result.isRight()) {
			expect(result.value.signature).toBeInstanceOf(Signature)
			expect(result.value.signature.documentId.toString()).toBe(
				document.id.toString(),
			)
			expect(result.value.signature.signedBy.toString()).toBe(SIGNER_ID)
			expect(result.value.signature.signatureImageKey).toBe(BLOB_KEY)
			expect(result.value.signature.ipAddress).toBe('127.0.0.1')
			expect(result.value.signature.userAgent).toBe('TestAgent/1.0')
		}
		expect(inMemorySignatureRepository.items).toHaveLength(1)
	})

	it('should create an audit log on successful signing', async () => {
		const document = makeSignableDocument()
		await inMemoryDocumentRepository.create(document)
		inMemoryBlobStorageRepository.items.push({
			blobName: BLOB_KEY,
			uploadUrl: 'https://example.com/upload',
			size: 512,
			lastModified: new Date(),
			contentType: 'image/png',
		})

		await sut.execute({
			documentId: document.id.toString(),
			signedBy: SIGNER_ID,
			signatureImageKey: BLOB_KEY,
		})

		expect(mockAuditLog.calls).toHaveLength(1)
		expect((mockAuditLog.calls[0] as any).action).toBe('SIGN')
		expect((mockAuditLog.calls[0] as any).resourceType).toBe('DOCUMENT')
	})

	it('should send a notification on successful signing', async () => {
		const document = makeSignableDocument()
		await inMemoryDocumentRepository.create(document)
		inMemoryBlobStorageRepository.items.push({
			blobName: BLOB_KEY,
			uploadUrl: 'https://example.com/upload',
			size: 512,
			lastModified: new Date(),
			contentType: 'image/png',
		})

		await sut.execute({
			documentId: document.id.toString(),
			signedBy: SIGNER_ID,
			signatureImageKey: BLOB_KEY,
		})

		expect(mockNotification.calls).toHaveLength(1)
		expect((mockNotification.calls[0] as any).linkedDocumentId).toBe(
			document.id.toString(),
		)
	})

	it('should return DocumentNotFoundError when document does not exist', async () => {
		const result = await sut.execute({
			documentId: 'non-existent-id',
			signedBy: SIGNER_ID,
			signatureImageKey: BLOB_KEY,
		})

		expect(result.isLeft()).toBeTruthy()
		expect(result.value).toBeInstanceOf(DocumentNotFoundError)
	})

	it('should return DocumentNotSignableError when document is in a non-signable folder', async () => {
		const document = makeSignableDocument({ folder: NON_SIGNABLE_FOLDER })
		await inMemoryDocumentRepository.create(document)

		const result = await sut.execute({
			documentId: document.id.toString(),
			signedBy: SIGNER_ID,
			signatureImageKey: BLOB_KEY,
		})

		expect(result.isLeft()).toBeTruthy()
		expect(result.value).toBeInstanceOf(DocumentNotSignableError)
	})

	it('should return DocumentAlreadySignedError when document is already signed', async () => {
		const document = makeSignableDocument()
		await inMemoryDocumentRepository.create(document)

		const existingSignature = Signature.create({
			documentId: document.id,
			signedBy: CLIENT_ID,
			signatureImageKey: BLOB_KEY,
			ipAddress: null,
			userAgent: null,
		})
		await inMemorySignatureRepository.create(existingSignature)

		const result = await sut.execute({
			documentId: document.id.toString(),
			signedBy: SIGNER_ID,
			signatureImageKey: BLOB_KEY,
		})

		expect(result.isLeft()).toBeTruthy()
		expect(result.value).toBeInstanceOf(DocumentAlreadySignedError)
	})

	it('should return SignatureImageNotFoundError when blob does not exist in storage', async () => {
		const document = makeSignableDocument()
		await inMemoryDocumentRepository.create(document)

		const result = await sut.execute({
			documentId: document.id.toString(),
			signedBy: SIGNER_ID,
			signatureImageKey: 'non-existent-blob.png',
		})

		expect(result.isLeft()).toBeTruthy()
		expect(result.value).toBeInstanceOf(SignatureImageNotFoundError)
	})

	it('should work with SIGNED_DOCUMENTS folder', async () => {
		const document = makeSignableDocument({
			folder: DocumentFolder.create('SIGNED_DOCUMENTS'),
		})
		await inMemoryDocumentRepository.create(document)
		inMemoryBlobStorageRepository.items.push({
			blobName: BLOB_KEY,
			uploadUrl: 'https://example.com/upload',
			size: 512,
			lastModified: new Date(),
			contentType: 'image/png',
		})

		const result = await sut.execute({
			documentId: document.id.toString(),
			signedBy: SIGNER_ID,
			signatureImageKey: BLOB_KEY,
		})

		expect(result.isRight()).toBeTruthy()
	})
})
