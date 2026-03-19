import { UploadClientProfilePhotoUseCase } from '@/domain/financial-management/application/use-cases/upload-client-profile-photo'
import { ClientNotFoundError } from '@/domain/financial-management/application/use-cases/errors/client-not-found-error'
import {
	Body,
	Controller,
	HttpCode,
	HttpStatus,
	NotFoundException,
	Param,
	Put,
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

const uploadClientProfilePhotoBodySchema = z.object({
	profilePhoto: z.string(),
})

type UploadClientProfilePhotoBodySchema = z.infer<
	typeof uploadClientProfilePhotoBodySchema
>

const bodyValidationPipe = new ZodValidationPipe(
	uploadClientProfilePhotoBodySchema,
)

@ApiTags('Clients')
@Controller('/clients/:clientId/profile-photo')
export class UploadClientProfilePhotoController {
	constructor(
		private uploadClientProfilePhoto: UploadClientProfilePhotoUseCase,
	) {}

	private errorMap = {
		[ClientNotFoundError.name]: NotFoundException,
	}

	@Put()
	@HttpCode(HttpStatus.OK)
	@ApiBearerAuth()
	@ApiOperation({
		summary: 'Upload client profile photo',
		description:
			'Uploads or replaces a profile photo for a client. The photo should be provided as a base64 encoded string.',
	})
	@ApiParam({ name: 'clientId', description: 'Client ID', type: String })
	@ApiBody({
		schema: {
			type: 'object',
			required: ['profilePhoto'],
			properties: {
				profilePhoto: {
					type: 'string',
					description: 'Base64 encoded image string',
					example: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA...',
				},
			},
		},
		description: 'Profile photo upload payload',
	})
	@ApiResponse({
		status: HttpStatus.OK,
		description: 'Profile photo successfully uploaded',
		schema: {
			type: 'object',
			properties: {
				message: {
					type: 'string',
					example: 'Profile photo uploaded successfully',
				},
			},
		},
	})
	@ApiResponse({
		status: HttpStatus.NOT_FOUND,
		description: 'Client not found',
	})
	async handle(
		@Param('clientId') clientId: string,
		@Body(bodyValidationPipe) body: UploadClientProfilePhotoBodySchema,
	) {
		const { profilePhoto } = body

		const response = await this.uploadClientProfilePhoto.execute({
			clientId,
			profilePhoto,
		})

		if (response.isLeft()) {
			const error = response.value
			const exception =
				this.errorMap[error.constructor.name] || NotFoundException

			throw new exception(error.message)
		}

		return {
			message: 'Profile photo uploaded successfully',
		}
	}
}
