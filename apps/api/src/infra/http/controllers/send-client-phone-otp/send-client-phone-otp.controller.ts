import {
	BadRequestException,
	Body,
	Controller,
	HttpCode,
	HttpStatus,
	NotFoundException,
	Post,
	UnprocessableEntityException,
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
import { SendClientPhoneOtpUseCase } from '@/domain/authentication/application/use-cases/send-client-phone-otp'
import { CurrentUser } from '@/infra/auth/better-auth/current-user.decorator'
import { HttpUserResponse } from '../../presenters/http-user-presenter'
import { PhoneNumberMismatchError } from '@/domain/authentication/application/use-cases/errors/phone-number-mismatch-error'
import { ClientNotFoundError } from '@/domain/financial-management/application/use-cases/errors/client-not-found-error'
import { AuthError } from '@/domain/authentication/application/use-cases/errors/auth-error'

const sendClientPhoneOtpBodySchema = z.object({
	phoneNumber: z
		.string()
		.regex(
			/^\+\d{10,15}$/,
			'Phone number must be in E.164 format (+1234567890)',
		)
		.optional(),
})

type SendClientPhoneOtpBodySchema = z.infer<typeof sendClientPhoneOtpBodySchema>

const bodyValidationPipe = new ZodValidationPipe(sendClientPhoneOtpBodySchema)

@ApiTags('Authentication')
@Controller('/auth/client/send-phone-otp')
export class SendClientPhoneOtpController {
	constructor(private sendClientPhoneOtp: SendClientPhoneOtpUseCase) {}

	private errorMap = {
		[PhoneNumberMismatchError.name]: UnprocessableEntityException,
		[ClientNotFoundError.name]: NotFoundException,
		[AuthError.name]: BadRequestException,
	}

	@Post()
	@HttpCode(HttpStatus.OK)
	@ApiBearerAuth()
	@ApiOperation({
		summary: 'Send OTP to client phone number',
		description:
			'Sends OTP for onboarding verification or new device login. During onboarding (status not ACTIVE), phone number must be provided and validated against invitation. For active users, phone number is retrieved from profile automatically.',
	})
	@ApiBody({
		schema: {
			type: 'object',
			properties: {
				phoneNumber: {
					type: 'string',
					description:
						'Phone number in E.164 format (required during onboarding, optional for active users)',
					example: '+15551234567',
					pattern: '^\\+\\d{10,15}$',
				},
			},
		},
	})
	@ApiResponse({
		status: 200,
		description: 'OTP sent successfully',
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
		status: 400,
		description: 'Phone number required during onboarding, or OTP send failed',
	})
	@ApiResponse({
		status: 422,
		description: 'Phone number mismatch',
	})
	@ApiResponse({
		status: 401,
		description: 'User not authenticated',
	})
	async handle(
		@CurrentUser() user: HttpUserResponse,
		@Body(bodyValidationPipe) body: SendClientPhoneOtpBodySchema,
	) {
		const userId = user?.id
		const { phoneNumber } = body

		const response = await this.sendClientPhoneOtp.execute({
			phoneNumber,
			clientId: userId,
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
