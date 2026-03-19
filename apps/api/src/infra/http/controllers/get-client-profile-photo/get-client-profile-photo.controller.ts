import { GetClientProfilePhotoUseCase } from '@/domain/financial-management/application/use-cases/get-client-profile-photo'
import { ClientNotFoundError } from '@/domain/financial-management/application/use-cases/errors/client-not-found-error'
import {
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	NotFoundException,
	Param,
} from '@nestjs/common'
import {
	ApiBearerAuth,
	ApiOperation,
	ApiParam,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger'

@ApiTags('Clients')
@Controller('/clients/:clientId/profile-photo')
export class GetClientProfilePhotoController {
	constructor(private getClientProfilePhoto: GetClientProfilePhotoUseCase) {}

	private errorMap = {
		[ClientNotFoundError.name]: NotFoundException,
	}

	@Get()
	@HttpCode(HttpStatus.OK)
	@ApiBearerAuth()
	@ApiOperation({
		summary: 'Get client profile photo',
		description:
			'Retrieves the profile photo for a client as a base64 encoded string.',
	})
	@ApiParam({ name: 'clientId', description: 'Client ID', type: String })
	@ApiResponse({
		status: HttpStatus.OK,
		description: 'Profile photo retrieved successfully',
		schema: {
			type: 'object',
			properties: {
				profilePhoto: {
					type: 'string',
					nullable: true,
					description: 'Base64 encoded image string or null if not set',
					example: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA...',
				},
			},
		},
	})
	@ApiResponse({
		status: HttpStatus.NOT_FOUND,
		description: 'Client not found',
	})
	async handle(@Param('clientId') clientId: string) {
		const response = await this.getClientProfilePhoto.execute({
			clientId,
		})

		if (response.isLeft()) {
			const error = response.value
			const exception =
				this.errorMap[error.constructor.name] || NotFoundException

			throw new exception(error.message)
		}

		return {
			profilePhoto: response.value.profilePhoto,
		}
	}
}
