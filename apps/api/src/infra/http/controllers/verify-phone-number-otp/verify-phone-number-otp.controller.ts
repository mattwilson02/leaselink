import {
	BadRequestException,
	Body,
	Controller,
	HttpCode,
	HttpStatus,
	NotFoundException,
	Post,
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
import { VerifyPhoneNumberOtpUseCase } from '@/domain/authentication/application/use-cases/verify-phone-number-otp'
import { CurrentUser } from '@/infra/auth/better-auth/current-user.decorator'
import { HttpUserResponse } from '../../presenters/http-user-presenter'
import { ClientNotFoundError } from '@/domain/financial-management/application/use-cases/errors/client-not-found-error'
import { AuthError } from '@/domain/authentication/application/use-cases/errors/auth-error'

const verifyPhoneNumberOtpBodySchema = z.object({
	otp: z
		.string()
		.length(6, 'OTP must be exactly 6 digits')
		.regex(/^\d{6}$/, 'OTP must contain only digits'),
})

type VerifyPhoneNumberOtpBodySchema = z.infer<
	typeof verifyPhoneNumberOtpBodySchema
>

const bodyValidationPipe = new ZodValidationPipe(verifyPhoneNumberOtpBodySchema)

@ApiTags('Authentication')
@Controller('/auth/verify-phone-number')
export class VerifyPhoneNumberOtpController {
	constructor(private verifyPhoneNumberOtp: VerifyPhoneNumberOtpUseCase) {}

	private errorMap = {
		[ClientNotFoundError.name]: NotFoundException,
		[AuthError.name]: BadRequestException,
	}

	@Post()
	@HttpCode(HttpStatus.OK)
	@ApiBearerAuth()
	@ApiOperation({
		summary: 'Verify phone number with OTP',
		description:
			"Verifies the client's phone number using the provided OTP code. The phone number is retrieved from the client's profile.",
	})
	@ApiBody({
		schema: {
			type: 'object',
			required: ['otp'],
			properties: {
				otp: {
					type: 'string',
					description: '6-digit OTP code',
					example: '123456',
					pattern: '^\\d{6}$',
					minLength: 6,
					maxLength: 6,
				},
			},
		},
	})
	@ApiResponse({
		status: 200,
		description: 'Phone number verified successfully',
		schema: {
			type: 'object',
			properties: {
				success: {
					type: 'boolean',
					example: true,
				},
				phoneNumberVerified: {
					type: 'boolean',
					example: true,
				},
			},
		},
	})
	@ApiResponse({
		status: 400,
		description: 'Invalid OTP or phone number not found',
	})
	@ApiResponse({
		status: 404,
		description: 'Client not found',
	})
	@ApiResponse({
		status: 401,
		description: 'User not authenticated',
	})
	async handle(
		@CurrentUser() user: HttpUserResponse,
		@Body(bodyValidationPipe) body: VerifyPhoneNumberOtpBodySchema,
	) {
		const userId = user?.id
		const { otp } = body

		const response = await this.verifyPhoneNumberOtp.execute({
			clientId: userId,
			otp,
		})

		if (response.isLeft()) {
			const error = response.value
			const exception =
				this.errorMap[error.constructor.name] || NotFoundException

			throw new exception(error.message)
		}

		return response.value
	}
}
