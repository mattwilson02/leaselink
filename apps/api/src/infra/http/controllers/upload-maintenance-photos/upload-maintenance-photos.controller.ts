import { UploadMaintenancePhotosUseCase } from '@/domain/maintenance/application/use-cases/upload-maintenance-photos'
import { MaintenanceRequestNotFoundError } from '@/domain/maintenance/application/use-cases/errors/maintenance-request-not-found-error'
import { MaintenancePhotoLimitExceededError } from '@/domain/maintenance/application/use-cases/errors/maintenance-photo-limit-exceeded-error'
import {
	BadRequestException,
	Body,
	Controller,
	HttpCode,
	HttpStatus,
	NotFoundException,
	Param,
	Post,
	UnauthorizedException,
} from '@nestjs/common'
import {
	ApiBearerAuth,
	ApiBody,
	ApiOperation,
	ApiParam,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger'
import { ZodValidationPipe } from 'nestjs-zod'
import { z } from 'zod'
import { CurrentUser } from '@/infra/auth/better-auth/current-user.decorator'
import { HttpUserResponse } from '../../presenters/http-user-presenter'

const uploadPhotosSchema = z.object({
	files: z
		.array(
			z.object({
				fileName: z.string().min(1),
				contentType: z.string().min(1),
			}),
		)
		.min(1, 'At least one file is required'),
})

type UploadPhotosBody = z.infer<typeof uploadPhotosSchema>

const bodyValidationPipe = new ZodValidationPipe(uploadPhotosSchema)

@ApiTags('Maintenance Requests')
@Controller('/maintenance-requests')
export class UploadMaintenancePhotosController {
	constructor(
		private uploadMaintenancePhotos: UploadMaintenancePhotosUseCase,
	) {}

	@Post(':id/photos')
	@HttpCode(HttpStatus.OK)
	@ApiBearerAuth()
	@ApiOperation({
		summary:
			'Generate upload URLs for maintenance request photos (tenant only)',
	})
	@ApiParam({ name: 'id', description: 'Maintenance request UUID' })
	@ApiBody({
		schema: {
			type: 'object',
			required: ['files'],
			properties: {
				files: {
					type: 'array',
					items: {
						type: 'object',
						properties: {
							fileName: { type: 'string' },
							contentType: { type: 'string' },
						},
					},
				},
			},
		},
	})
	@ApiResponse({ status: 200, description: 'Upload URLs generated' })
	@ApiResponse({ status: 400, description: 'Photo limit exceeded' })
	@ApiResponse({ status: 404, description: 'Not found' })
	async handle(
		@CurrentUser() user: HttpUserResponse,
		@Param('id') requestId: string,
		@Body(bodyValidationPipe) body: UploadPhotosBody,
	) {
		if (user.type !== 'CLIENT') {
			throw new UnauthorizedException('Only tenants can upload photos')
		}

		const response = await this.uploadMaintenancePhotos.execute({
			requestId,
			tenantId: user.id,
			files: body.files,
		})

		if (response.isLeft()) {
			const error = response.value
			if (error instanceof MaintenanceRequestNotFoundError) {
				throw new NotFoundException(error.message)
			}
			if (error instanceof MaintenancePhotoLimitExceededError) {
				throw new BadRequestException(error.message)
			}
			throw new BadRequestException(error.message)
		}

		return {
			uploadUrls: response.value.uploadUrls,
			blobKeys: response.value.blobKeys,
		}
	}
}
