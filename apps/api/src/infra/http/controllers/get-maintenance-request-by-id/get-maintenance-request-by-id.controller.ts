import { GetMaintenanceRequestByIdUseCase } from '@/domain/maintenance/application/use-cases/get-maintenance-request-by-id'
import { StorageRepository } from '@/domain/document/application/repositories/storage-repository'
import { Controller, Get, NotFoundException, Param } from '@nestjs/common'
import {
	ApiBearerAuth,
	ApiOperation,
	ApiParam,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger'
import { CurrentUser } from '@/infra/auth/better-auth/current-user.decorator'
import { HttpUserResponse } from '../../presenters/http-user-presenter'
import { HttpMaintenanceRequestPresenter } from '../../presenters/http-maintenance-request-presenter'

@ApiTags('Maintenance Requests')
@Controller('/maintenance-requests')
export class GetMaintenanceRequestByIdController {
	constructor(
		private getMaintenanceRequestById: GetMaintenanceRequestByIdUseCase,
		private storageRepository: StorageRepository,
	) {}

	@Get(':id')
	@ApiBearerAuth()
	@ApiOperation({ summary: 'Get maintenance request by ID' })
	@ApiParam({ name: 'id', description: 'Maintenance request UUID' })
	@ApiResponse({ status: 200, description: 'Maintenance request found' })
	@ApiResponse({ status: 404, description: 'Not found' })
	async handle(
		@CurrentUser() user: HttpUserResponse,
		@Param('id') requestId: string,
	) {
		const userRole = user.type === 'EMPLOYEE' ? 'manager' : 'tenant'

		const response = await this.getMaintenanceRequestById.execute({
			requestId,
			userId: user.id,
			userRole,
		})

		if (response.isLeft()) {
			const error = response.value
			throw new NotFoundException(error.message)
		}

		const result = HttpMaintenanceRequestPresenter.toHTTP(
			response.value.request,
		)

		// Generate signed URLs for photos
		const photoUrls = await Promise.all(
			result.photos.map(async (blobName) => {
				const urlResult = await this.storageRepository.generateDownloadUrl({
					blobName,
				})
				return urlResult.isRight() ? urlResult.value.downloadUrl : blobName
			}),
		)

		return {
			data: {
				...result,
				photos: photoUrls,
			},
		}
	}
}
