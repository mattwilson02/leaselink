import { Controller, Get, Request, UnauthorizedException } from '@nestjs/common'
import {
	ApiBearerAuth,
	ApiOperation,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { Request as ExpressRequest } from 'express'
import { Public, AuthService } from '@thallesp/nestjs-better-auth'

@ApiTags('Sessions')
@Controller('/sessions')
export class GetSessionsController {
	constructor(
		private readonly prisma: PrismaService,
		private readonly authService: AuthService,
	) {}

	@Get()
	@Public()
	@ApiBearerAuth()
	@ApiOperation({
		summary: 'List active sessions',
		description: 'Returns all active sessions for the authenticated user',
	})
	@ApiResponse({
		status: 200,
		description: 'Returns active sessions',
		schema: {
			type: 'object',
			properties: {
				sessions: {
					type: 'array',
					items: {
						type: 'object',
						properties: {
							id: { type: 'string' },
							createdAt: { type: 'string', format: 'date-time' },
							ipAddress: { type: 'string', nullable: true },
							userAgent: { type: 'string', nullable: true },
							isCurrent: { type: 'boolean' },
						},
					},
				},
			},
		},
	})
	async handle(@Request() req: ExpressRequest) {
		const token = req.headers.authorization?.split(' ').pop()

		if (!token) {
			throw new UnauthorizedException('No token provided')
		}

		const sessionData = await this.authService.api.getSession({
			headers: { authorization: `Bearer ${token}` },
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

		const sessions = await this.prisma.session.findMany({
			where: {
				userId,
				expiresAt: { gt: new Date() },
			},
			orderBy: { createdAt: 'desc' },
		})

		return {
			sessions: sessions.map((session) => ({
				id: session.id,
				createdAt: session.createdAt.toISOString(),
				ipAddress: session.ipAddress ?? null,
				userAgent: session.userAgent ?? null,
				isCurrent: session.token === token,
			})),
		}
	}
}
