import {
	BadRequestException,
	Controller,
	Delete,
	HttpCode,
	HttpStatus,
	NotFoundException,
	Param,
	Request,
	UnauthorizedException,
} from '@nestjs/common'
import {
	ApiBearerAuth,
	ApiOperation,
	ApiParam,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { Public, AuthService } from '@thallesp/nestjs-better-auth'
import { Request as ExpressRequest } from 'express'

@ApiTags('Sessions')
@Controller('/sessions')
export class RevokeSessionController {
	constructor(
		private readonly prisma: PrismaService,
		private readonly authService: AuthService,
	) {}

	@Delete(':id')
	@Public()
	@HttpCode(HttpStatus.NO_CONTENT)
	@ApiBearerAuth()
	@ApiOperation({
		summary: 'Revoke a session',
		description: 'Revokes a specific active session for the authenticated user',
	})
	@ApiParam({ name: 'id', description: 'Session ID to revoke' })
	@ApiResponse({ status: 204, description: 'Session revoked successfully' })
	@ApiResponse({ status: 400, description: 'Cannot revoke current session' })
	@ApiResponse({ status: 404, description: 'Session not found' })
	async handle(@Param('id') id: string, @Request() req: ExpressRequest) {
		const currentToken = req.headers.authorization?.split(' ').pop()

		if (!currentToken) {
			throw new UnauthorizedException('No token provided')
		}

		const sessionData = await this.authService.api.getSession({
			headers: { authorization: `Bearer ${currentToken}` },
		})

		const userId =
			sessionData && 'session' in sessionData
				? (sessionData as { session: { userId: string } }).session.userId
				: sessionData && 'userId' in sessionData
					? (sessionData as { userId: string }).userId
					: null

		if (!userId) {
			throw new UnauthorizedException('Invalid or expired token')
		}

		const session = await this.prisma.session.findUnique({
			where: { id },
		})

		if (!session || session.userId !== userId) {
			throw new NotFoundException('Session not found')
		}

		if (session.token === currentToken) {
			throw new BadRequestException('Cannot revoke current session')
		}

		await this.prisma.session.delete({ where: { id } })
	}
}
