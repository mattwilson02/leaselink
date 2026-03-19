import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { MaintenanceRequestsRepository } from '../repositories/maintenance-requests-repository'
import { StorageRepository } from '@/domain/document/application/repositories/storage-repository'
import { MaintenanceRequestNotFoundError } from './errors/maintenance-request-not-found-error'
import { MaintenancePhotoLimitExceededError } from './errors/maintenance-photo-limit-exceeded-error'
import { MAX_MAINTENANCE_PHOTOS } from '@leaselink/shared'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'

export interface UploadMaintenancePhotosUseCaseRequest {
	requestId: string
	tenantId: string
	files: Array<{ fileName: string; contentType: string }>
}

type UploadMaintenancePhotosUseCaseResponse = Either<
	MaintenanceRequestNotFoundError | MaintenancePhotoLimitExceededError | Error,
	{ uploadUrls: string[]; blobKeys: string[] }
>

@Injectable()
export class UploadMaintenancePhotosUseCase {
	constructor(
		private maintenanceRequestsRepository: MaintenanceRequestsRepository,
		private storageRepository: StorageRepository,
	) {}

	async execute(
		input: UploadMaintenancePhotosUseCaseRequest,
	): Promise<UploadMaintenancePhotosUseCaseResponse> {
		const request = await this.maintenanceRequestsRepository.findById(
			input.requestId,
		)

		if (!request || request.tenantId.toString() !== input.tenantId) {
			return left(new MaintenanceRequestNotFoundError())
		}

		if (request.photos.length + input.files.length > MAX_MAINTENANCE_PHOTOS) {
			return left(new MaintenancePhotoLimitExceededError())
		}

		const uploadUrls: string[] = []
		const blobKeys: string[] = []

		for (const file of input.files) {
			const blobKey = `maintenance-requests/${input.requestId}/photos/${new UniqueEntityId().toString()}-${file.fileName}`
			const result = await this.storageRepository.generateUploadUrl(
				blobKey,
				file.contentType,
			)

			if (result.isLeft()) {
				return left(result.value)
			}

			uploadUrls.push(result.value)
			blobKeys.push(blobKey)
		}

		return right({ uploadUrls, blobKeys })
	}
}
