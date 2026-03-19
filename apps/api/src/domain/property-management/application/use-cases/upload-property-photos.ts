import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { Property } from '../../enterprise/entities/property'
import { PropertiesRepository } from '../repositories/properties-repository'
import { PropertyNotFoundError } from './errors/property-not-found-error'
import { StorageRepository } from '@/domain/document/application/repositories/storage-repository'
import { MAX_PROPERTY_PHOTOS } from '@leaselink/shared'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'

export interface UploadPropertyPhotosUseCaseRequest {
	propertyId: string
	managerId: string
	fileNames: string[]
}

type UploadPropertyPhotosUseCaseResponse = Either<
	PropertyNotFoundError | Error,
	{ uploadUrls: string[] }
>

@Injectable()
export class UploadPropertyPhotosUseCase {
	constructor(
		private propertiesRepository: PropertiesRepository,
		private storageRepository: StorageRepository,
	) {}

	async execute(
		request: UploadPropertyPhotosUseCaseRequest,
	): Promise<UploadPropertyPhotosUseCaseResponse> {
		const property = await this.propertiesRepository.findById(
			request.propertyId,
		)

		if (!property || property.managerId.toString() !== request.managerId) {
			return left(new PropertyNotFoundError(request.propertyId))
		}

		const currentCount = property.photos.length
		if (currentCount + request.fileNames.length > MAX_PROPERTY_PHOTOS) {
			return left(
				new Error(
					`Cannot exceed ${MAX_PROPERTY_PHOTOS} photos per property. Current: ${currentCount}, attempting to add: ${request.fileNames.length}.`,
				),
			)
		}

		const uploadUrls: string[] = []
		const blobNames: string[] = []

		for (const fileName of request.fileNames) {
			const blobKey = `properties/${request.propertyId}/photos/${new UniqueEntityId().toString()}-${fileName}`
			const result = await this.storageRepository.generateUploadUrl(blobKey)

			if (result.isLeft()) {
				return left(result.value)
			}

			uploadUrls.push(result.value)
			blobNames.push(blobKey)
		}

		property.photos = [...property.photos, ...blobNames]
		await this.propertiesRepository.update(property)

		return right({ uploadUrls })
	}
}
