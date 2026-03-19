import { Controller, Get } from '@nestjs/common'
import {
	ApiBearerAuth,
	ApiHeader,
	ApiOperation,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger'
import { CurrentUser } from '@/infra/auth/better-auth/current-user.decorator'
import { HttpUserResponse } from '../../presenters/http-user-presenter'
import { UnifiedUserDTO } from '../../DTOs/unified-user-dto'

@ApiTags('Authentication')
@Controller('/auth/me')
export class AuthController {
	@Get()
	@ApiBearerAuth()
	@ApiHeader({
		name: 'Device-Id',
		description: 'Unique identifier for the device',
		required: false,
	})
	@ApiOperation({
		summary: 'Get current user',
		description: 'Get the authenticated user information',
	})
	@ApiResponse({
		status: 200,
		description: 'Returns the authenticated user information',
		type: UnifiedUserDTO,
	})
	@ApiResponse({
		status: 401,
		description: 'User not authenticated',
		type: UnifiedUserDTO,
	})
	async handle(@CurrentUser() user: HttpUserResponse): Promise<UnifiedUserDTO> {
		return user
	}
}
