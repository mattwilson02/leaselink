import { CreateSession } from '@/domain/authentication/application/use-cases/create-session'
import { EnvService } from '@/infra/env/env.service'
import {
	Controller,
	ForbiddenException,
	Get,
	HttpStatus,
	Param,
} from '@nestjs/common'
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger'
import { CreateTestJWTResponseDTO } from '../../DTOs/create-test-jwt-response-dto'
import { RouteAllowedOnlyInDevDTO } from '../../DTOs/route-allowed-only-in-dev-dto'
import { Public } from '@thallesp/nestjs-better-auth'
import { AuthUserType } from '@/domain/financial-management/enterprise/entities/value-objects/auth-user-type'

enum UserType {
	EMPLOYEE = 'employee',
	CLIENT = 'client',
}

@ApiTags('🔐Auth: Generate JWT (Better Auth)')
@Public()
@Controller('/token/generate/:userType')
export class GetTestJWTController {
	constructor(
		private createSession: CreateSession,
		private envService: EnvService,
	) {}

	@Get()
	@ApiOperation({
		summary: 'Generate a test JWT',
		description:
			'Creates a test session and returns a JWT (Only in Development).',
	})
	@ApiParam({
		name: 'userType',
		enum: UserType,
		description: 'Type of client to generate token for (employee or client)',
		required: true,
	})
	@ApiResponse({
		status: HttpStatus.OK,
		description: 'JWT successfully generated for testing',
		type: CreateTestJWTResponseDTO,
	})
	@ApiResponse({
		status: HttpStatus.FORBIDDEN,
		description: 'This route is only available in development',
		type: RouteAllowedOnlyInDevDTO,
	})
	async handle(@Param('userType') userType: string) {
		const env = this.envService.get('NODE_ENV')
		if (env !== 'development' && env !== 'test') {
			throw new ForbiddenException(
				'This route is only available in development',
			)
		}

		if (userType !== UserType.EMPLOYEE && userType !== UserType.CLIENT) {
			throw new ForbiddenException(
				'Invalid userType. Must be either "employee" or "client"',
			)
		}

		const response = await this.createSession.execute({
			userType: AuthUserType.create({
				value: userType === UserType.EMPLOYEE ? 'EMPLOYEE' : 'CLIENT',
			}),
		})

		if (response.isLeft()) {
			throw new Error(response.value.message)
		}

		return {
			sessionId: response.value.session.id.toString(),
			token: response.value.session.token,
		}
	}
}
