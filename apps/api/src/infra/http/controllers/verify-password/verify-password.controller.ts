import {
	BadRequestException,
	Body,
	Controller,
	HttpCode,
	HttpStatus,
	Post,
	UnauthorizedException,
} from '@nestjs/common'
import {
	ApiBearerAuth,
	ApiBody,
	ApiOperation,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger'
import { z } from 'zod'
import { ZodValidationPipe } from 'nestjs-zod'
import { VerifyPasswordUseCase } from '@/domain/authentication/application/use-cases/verify-password'
import { CurrentUser } from '@/infra/auth/better-auth/current-user.decorator'
import { HttpUserResponse } from '../../presenters/http-user-presenter'
import { InvalidPasswordError } from '@/domain/authentication/application/use-cases/errors/invalid-password-error'
import { AuthError } from '@/domain/authentication/application/use-cases/errors/auth-error'

const verifyPasswordBodySchema = z.object({
	password: z.string().min(1, 'Password is required'),
})

type VerifyPasswordBodySchema = z.infer<typeof verifyPasswordBodySchema>

const bodyValidationPipe = new ZodValidationPipe(verifyPasswordBodySchema)

@ApiTags('Authentication')
@Controller('/auth/verify-password')
export class VerifyPasswordController {
	constructor(private verifyPassword: VerifyPasswordUseCase) {}

	private errorMap = {
		[InvalidPasswordError.name]: UnauthorizedException,
		[AuthError.name]: BadRequestException,
	}

	@Post()
	@HttpCode(HttpStatus.OK)
	@ApiBearerAuth()
	@ApiOperation({
		summary: 'Verify current password',
		description:
			"Verifies the authenticated user's current password. Used before sensitive operations.",
	})
	@ApiBody({
		schema: {
			type: 'object',
			required: ['password'],
			properties: {
				password: {
					type: 'string',
					description: 'The current password to verify',
					minLength: 1,
					example: 'MySecurePassword123!',
				},
			},
		},
	})
	@ApiResponse({
		status: HttpStatus.OK,
		description: 'Password verified successfully',
		schema: {
			type: 'object',
			properties: {
				success: {
					type: 'boolean',
					example: true,
				},
			},
		},
	})
	@ApiResponse({
		status: HttpStatus.UNAUTHORIZED,
		description: 'Invalid password or user not authenticated',
	})
	@ApiResponse({
		status: HttpStatus.BAD_REQUEST,
		description: 'Validation error',
	})
	async handle(
		@CurrentUser() user: HttpUserResponse,
		@Body(bodyValidationPipe) body: VerifyPasswordBodySchema,
	) {
		const { password } = body

		const response = await this.verifyPassword.execute({
			authUserId: user.authUserId,
			password,
		})

		if (response.isLeft()) {
			const error = response.value
			const exception =
				this.errorMap[error.constructor.name] || BadRequestException

			throw new exception(error.message)
		}

		return response.value
	}
}
