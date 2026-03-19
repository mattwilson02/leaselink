import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { makeMaintenanceRequest } from 'test/factories/make-maintenance-request'
import { InMemoryMaintenanceRequestsRepository } from 'test/repositories/prisma/in-memory-maintenance-requests-repository'
import { InMemoryBlobStorageRepository } from 'test/repositories/prisma/in-memory-blob-storage-repository'
import { UploadMaintenancePhotosUseCase } from './upload-maintenance-photos'
import { MaintenanceRequestNotFoundError } from './errors/maintenance-request-not-found-error'
import { MaintenancePhotoLimitExceededError } from './errors/maintenance-photo-limit-exceeded-error'

let inMemoryMaintenanceRequestsRepository: InMemoryMaintenanceRequestsRepository
let inMemoryBlobStorageRepository: InMemoryBlobStorageRepository
let sut: UploadMaintenancePhotosUseCase

describe('Upload maintenance photos', () => {
	beforeEach(() => {
		inMemoryMaintenanceRequestsRepository =
			new InMemoryMaintenanceRequestsRepository()
		inMemoryBlobStorageRepository = new InMemoryBlobStorageRepository()

		sut = new UploadMaintenancePhotosUseCase(
			inMemoryMaintenanceRequestsRepository,
			inMemoryBlobStorageRepository,
		)
	})

	it('should generate upload URLs', async () => {
		const tenantId = new UniqueEntityId('tenant-1')
		const request = makeMaintenanceRequest({ tenantId })
		await inMemoryMaintenanceRequestsRepository.create(request)

		const result = await sut.execute({
			requestId: request.id.toString(),
			tenantId: 'tenant-1',
			files: [
				{ fileName: 'photo1.jpg', contentType: 'image/jpeg' },
				{ fileName: 'photo2.jpg', contentType: 'image/jpeg' },
				{ fileName: 'photo3.jpg', contentType: 'image/jpeg' },
			],
		})

		expect(result.isRight()).toBeTruthy()
		if (result.isRight()) {
			expect(result.value.uploadUrls).toHaveLength(3)
			expect(result.value.blobKeys).toHaveLength(3)
		}
	})

	it('should reject if exceeds photo limit', async () => {
		const tenantId = new UniqueEntityId('tenant-1')
		const existingPhotos = Array.from({ length: 8 }, (_, i) => `photo-${i}.jpg`)
		const request = makeMaintenanceRequest({ tenantId, photos: existingPhotos })
		await inMemoryMaintenanceRequestsRepository.create(request)

		const result = await sut.execute({
			requestId: request.id.toString(),
			tenantId: 'tenant-1',
			files: [
				{ fileName: 'photo-new-1.jpg', contentType: 'image/jpeg' },
				{ fileName: 'photo-new-2.jpg', contentType: 'image/jpeg' },
				{ fileName: 'photo-new-3.jpg', contentType: 'image/jpeg' },
			],
		})

		expect(result.isLeft()).toBeTruthy()
		expect(result.value).toBeInstanceOf(MaintenancePhotoLimitExceededError)
	})

	it('should reject if tenant does not own the request', async () => {
		const request = makeMaintenanceRequest({
			tenantId: new UniqueEntityId('other-tenant'),
		})
		await inMemoryMaintenanceRequestsRepository.create(request)

		const result = await sut.execute({
			requestId: request.id.toString(),
			tenantId: 'tenant-1',
			files: [{ fileName: 'photo.jpg', contentType: 'image/jpeg' }],
		})

		expect(result.isLeft()).toBeTruthy()
		expect(result.value).toBeInstanceOf(MaintenanceRequestNotFoundError)
	})
})
