import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { makeProperty } from 'test/factories/make-property'
import { InMemoryPropertiesRepository } from 'test/repositories/prisma/in-memory-properties-repository'
import { InMemoryBlobStorageRepository } from 'test/repositories/prisma/in-memory-blob-storage-repository'
import { UploadPropertyPhotosUseCase } from './upload-property-photos'
import { PropertyNotFoundError } from './errors/property-not-found-error'

let inMemoryPropertiesRepository: InMemoryPropertiesRepository
let inMemoryBlobStorageRepository: InMemoryBlobStorageRepository
let sut: UploadPropertyPhotosUseCase

describe('Upload property photos', () => {
	beforeEach(() => {
		inMemoryPropertiesRepository = new InMemoryPropertiesRepository()
		inMemoryBlobStorageRepository = new InMemoryBlobStorageRepository()
		sut = new UploadPropertyPhotosUseCase(
			inMemoryPropertiesRepository,
			inMemoryBlobStorageRepository,
		)
	})

	it('should upload photos', async () => {
		const managerId = new UniqueEntityId('manager-1')
		const property = makeProperty({ managerId })
		await inMemoryPropertiesRepository.create(property)

		const result = await sut.execute({
			propertyId: property.id.toString(),
			managerId: 'manager-1',
			fileNames: ['photo1.jpg', 'photo2.jpg'],
		})

		expect(result.isRight()).toBeTruthy()
		if (result.isRight()) {
			expect(result.value.uploadUrls).toHaveLength(2)
		}
		expect(inMemoryPropertiesRepository.items[0].photos).toHaveLength(2)
	})

	it('should append to existing photos', async () => {
		const managerId = new UniqueEntityId('manager-1')
		const property = makeProperty({
			managerId,
			photos: ['existing-photo.jpg'],
		})
		await inMemoryPropertiesRepository.create(property)

		const result = await sut.execute({
			propertyId: property.id.toString(),
			managerId: 'manager-1',
			fileNames: ['photo1.jpg', 'photo2.jpg'],
		})

		expect(result.isRight()).toBeTruthy()
		expect(inMemoryPropertiesRepository.items[0].photos).toHaveLength(3)
	})

	it('should reject if exceeds limit', async () => {
		const managerId = new UniqueEntityId('manager-1')
		const existingPhotos = Array.from(
			{ length: 19 },
			(_, i) => `photo-${i}.jpg`,
		)
		const property = makeProperty({
			managerId,
			photos: existingPhotos,
		})
		await inMemoryPropertiesRepository.create(property)

		const result = await sut.execute({
			propertyId: property.id.toString(),
			managerId: 'manager-1',
			fileNames: ['photo-new-1.jpg', 'photo-new-2.jpg'],
		})

		expect(result.isLeft()).toBeTruthy()
		if (result.isLeft()) {
			expect(result.value.message).toContain('Cannot exceed')
		}
	})

	it('should return error if not found', async () => {
		const result = await sut.execute({
			propertyId: 'non-existent',
			managerId: 'manager-1',
			fileNames: ['photo.jpg'],
		})

		expect(result.isLeft()).toBeTruthy()
		expect(result.value).toBeInstanceOf(PropertyNotFoundError)
	})
})
