import { UploadPropertyPhotosUseCase } from '@/domain/property-management/application/use-cases/upload-property-photos'
import { PropertyNotFoundError } from '@/domain/property-management/application/use-cases/errors/property-not-found-error'
import {
	BadRequestException,
	Body,
	Controller,
	HttpStatus,
	NotFoundException,
	Param,
	Post,
	UseGuards,
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
import { EmployeeOnlyGuard } from '../../guards/employee-only.guard'
import { CurrentUser } from '@/infra/auth/better-auth/current-user.decorator'
import { HttpUserResponse } from '../../presenters/http-user-presenter'

const uploadPhotosSchema = z.object({
	fileNames: z
		.array(z.string().min(1))
		.min(1, 'At least one file name is required'),
})

type UploadPhotosBody = z.infer<typeof uploadPhotosSchema>

const bodyValidationPipe = new ZodValidationPipe(uploadPhotosSchema)

@ApiTags('Properties')
@Controller('/properties')
export class UploadPropertyPhotosController {
	constructor(private uploadPropertyPhotos: UploadPropertyPhotosUseCase) {}

	private errorMap: Record<string, any> = {
		[PropertyNotFoundError.name]: NotFoundException,
	}

	@Post(':id/photos')
	@UseGuards(EmployeeOnlyGuard)
	@ApiBearerAuth()
	@ApiOperation({
		summary: 'Generate upload URLs for property photos',
	})
	@ApiParam({ name: 'id', description: 'Property UUID' })
	@ApiBody({
		schema: {
			type: 'object',
			required: ['fileNames'],
			properties: {
				fileNames: {
					type: 'array',
					items: { type: 'string' },
					description: 'Array of file names to upload',
					example: ['photo1.jpg', 'photo2.png'],
				},
			},
		},
	})
	@ApiResponse({
		status: HttpStatus.OK,
		description: 'Upload URLs generated',
	})
	@ApiResponse({
		status: HttpStatus.NOT_FOUND,
		description: 'Property not found',
	})
	@ApiResponse({
		status: HttpStatus.BAD_REQUEST,
		description: 'Invalid request or photo limit exceeded',
	})
	async handle(
		@CurrentUser() user: HttpUserResponse,
		@Param('id') propertyId: string,
		@Body(bodyValidationPipe) body: UploadPhotosBody,
	) {
		const response = await this.uploadPropertyPhotos.execute({
			propertyId,
			managerId: user.id,
			fileNames: body.fileNames,
		})

		if (response.isLeft()) {
			const error = response.value
			const exception =
				this.errorMap[error.constructor.name] || BadRequestException
			throw new exception(error.message)
		}

		return {
			uploadUrls: response.value.uploadUrls,
		}
	}
}
