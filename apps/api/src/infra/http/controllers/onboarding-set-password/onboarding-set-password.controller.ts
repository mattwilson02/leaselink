import { OnboardingSetPasswordUseCase } from '@/domain/financial-management/application/use-cases/onboarding-set-password'
import { ClientNotFoundError } from '@/domain/financial-management/application/use-cases/errors/client-not-found-error'
import { InvalidOnboardingTokenError } from '@/domain/financial-management/application/use-cases/errors/invalid-onboarding-token-error'
import { PasswordChangeError } from '@/domain/financial-management/application/use-cases/errors/password-change-error'
import {
	BadRequestException,
	Body,
	Controller,
	HttpCode,
	HttpStatus,
	NotFoundException,
	Post,
	Req,
	UnauthorizedException,
	UseGuards,
} from '@nestjs/common'
import { Request } from 'express'
import {
	ApiBearerAuth,
	ApiBody,
	ApiOperation,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger'
import { ZodValidationPipe } from 'nestjs-zod'
import { z } from 'zod'
import { passwordSchema } from '@/infra/auth/password-validation'
import { CurrentUser } from '@/infra/auth/better-auth/current-user.decorator'
import { HttpUserResponse } from '../../presenters/http-user-presenter'
import { EnhancedAuthGuard } from '@/infra/auth/better-auth/guards/enhanced-auth-guard'

const onboardingSetPasswordBodySchema = z.object({
	newPassword: passwordSchema,
})

type OnboardingSetPasswordBodySchema = z.infer<
	typeof onboardingSetPasswordBodySchema
>

const bodyValidationPipe = new ZodValidationPipe(
	onboardingSetPasswordBodySchema,
)

@ApiTags('Authentication')
@Controller('/auth/onboarding/set-password')
@UseGuards(EnhancedAuthGuard)
export class OnboardingSetPasswordController {
	constructor(private onboardingSetPassword: OnboardingSetPasswordUseCase) {}

	private errorMap = {
		[ClientNotFoundError.name]: NotFoundException,
		[InvalidOnboardingTokenError.name]: UnauthorizedException,
		[PasswordChangeError.name]: BadRequestException,
	}

	@Post()
	@HttpCode(HttpStatus.OK)
	@ApiBearerAuth()
	@ApiOperation({
		summary: 'Set password during onboarding',
		description:
			'Allows a client to set their password during onboarding using their onboarding token as the current password.',
	})
	@ApiBody({
		schema: {
			type: 'object',
			required: ['newPassword'],
			properties: {
				newPassword: {
					type: 'string',
					description: 'The new password for the client',
					minLength: 8,
					maxLength: 100,
					example: 'MySecurePassword123!',
				},
			},
		},
		description: 'Password update payload',
	})
	@ApiResponse({
		status: HttpStatus.OK,
		description: 'Password successfully updated',
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
		status: HttpStatus.BAD_REQUEST,
		description: 'Password change failed',
	})
	@ApiResponse({
		status: HttpStatus.UNAUTHORIZED,
		description: 'Invalid onboarding token',
	})
	@ApiResponse({
		status: HttpStatus.NOT_FOUND,
		description: 'Client not found',
	})
	async handle(
		@CurrentUser() user: HttpUserResponse,
		@Req() request: Request,
		@Body(bodyValidationPipe) body: OnboardingSetPasswordBodySchema,
	) {
		// Only allow clients to use this endpoint
		if (user.type !== 'CLIENT') {
			throw new UnauthorizedException(
				'This endpoint is only available for clients',
			)
		}

		// Extract the token from the Authorization header
		const authHeader = request.headers.authorization
		const sessionToken = authHeader?.split(' ')[1]
		if (!sessionToken) {
			throw new UnauthorizedException('No session token provided')
		}

		const { newPassword } = body

		const response = await this.onboardingSetPassword.execute({
			clientId: user.id,
			newPassword,
			sessionToken,
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
