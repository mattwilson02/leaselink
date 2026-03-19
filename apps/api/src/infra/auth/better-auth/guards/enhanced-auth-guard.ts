import {
	CanActivate,
	ExecutionContext,
	Injectable,
	UnauthorizedException,
	Inject,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { AuthService } from '@thallesp/nestjs-better-auth'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { Client, Employee, IdentityProvider } from '@prisma/client'
import { HttpUserPresenter } from '@/infra/http/presenters/http-user-presenter'
import { Request } from 'express'
import { Auth } from 'better-auth'

interface RequestWithUser extends Request {
	user?: ReturnType<typeof HttpUserPresenter.toHTTP>
}

@Injectable()
export class EnhancedAuthGuard implements CanActivate {
	constructor(
		private readonly reflector: Reflector,
		@Inject(AuthService) private readonly auth: Auth,
		private readonly prismaService: PrismaService,
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest<RequestWithUser>()

		// Check if route is marked with @Public() decorator
		const isPublic = this.reflector.getAllAndOverride<boolean>('PUBLIC', [
			context.getHandler(),
			context.getClass(),
		])

		if (isPublic || this.isBetterAuthPublicRoute(request)) {
			return true
		}

		// Extract and verify the token
		const token = this.extractToken(request)

		if (!token) {
			throw new UnauthorizedException('No token provided')
		}

		// Verify the token using Better Auth
		const tokenPayload = await this.verifyToken(token)

		if (!tokenPayload) {
			throw new UnauthorizedException('Invalid or expired token')
		}

		// Populate additional context based on user type
		try {
			const newUserContext = await this.populateUserContext(request)

			// Attach the user context to the request object
			request.user = newUserContext

			return true
		} catch (error) {
			console.error('Failed to populate user context:', error)
			throw new UnauthorizedException('Failed to populate user context')
		}
	}

	private isBetterAuthPublicRoute(request: RequestWithUser): boolean {
		// Only Better Auth endpoints are hardcoded here
		// Other public routes should use the @Public() decorator
		const betterAuthPublicRoutes = [
			'/api/auth/sign-up/email',
			'/api/auth/sign-in/email',
			'/api/auth/forget-password',
			'/api/auth/reset-password',
			'/api/auth/sign-in/phone-number',
			'/api/auth/verify/phone-number',
			'/api/auth/sign-in/email-otp',
			'/api/auth/verify/email-otp',
		]

		return betterAuthPublicRoutes.some(
			(route) => request.path === route || request.path?.startsWith(route),
		)
	}

	private extractDeviceId(req: RequestWithUser): string | undefined {
		return req.headers['device-id'] as string | undefined
	}

	private async populateUserContext(request: RequestWithUser) {
		const token = this.extractToken(request)
		const deviceId = this.extractDeviceId(request)

		if (!token) {
			throw new UnauthorizedException('No token provided')
		}

		try {
			const tokenPayload = await this.verifyToken(token)

			if (!tokenPayload) {
				throw new UnauthorizedException('Invalid token payload')
			}

			// Extract userId from different response types
			const userId =
				'userId' in tokenPayload
					? tokenPayload.userId
					: 'session' in tokenPayload
						? tokenPayload.session.userId
						: null

			if (!userId) {
				throw new UnauthorizedException('No userId found in token payload')
			}

			const identityProvider = await this.findIdentityProvider(userId)

			if (!identityProvider) {
				throw new UnauthorizedException('User not found')
			}

			const betterAuthUser = await this.findBetterAuthUser(userId)

			if (!betterAuthUser) {
				throw new UnauthorizedException('Better Auth user not found')
			}

			const isDeviceRecognized = await this.compareDeviceIdWithUser(
				deviceId,
				identityProvider,
			)

			const user = await this.findUser(identityProvider)

			return HttpUserPresenter.toHTTP(
				user,
				identityProvider,
				betterAuthUser,
				isDeviceRecognized,
			)
		} catch (error) {
			console.error('Error populating user context:', error)
			throw error
		}
	}

	private async findIdentityProvider(providerUserId: string) {
		return await this.prismaService.identityProvider.findUnique({
			where: { providerUserId },
		})
	}

	private async compareDeviceIdWithUser(
		deviceId: string | undefined,
		identityProvider: IdentityProvider,
	): Promise<boolean> {
		if (identityProvider.userType === 'CLIENT') {
			const client = await this.prismaService.client.findUnique({
				where: { id: identityProvider.userId },
			})

			if (!client) {
				throw new UnauthorizedException('Client not found')
			}

			if (process.env.NODE_ENV === 'development' && client.deviceId === '*') {
				return true
			}

			if (!deviceId) return false

			return client.deviceId === deviceId
		}

		if (identityProvider.userType === 'EMPLOYEE') {
			const employee = await this.prismaService.employee.findUnique({
				where: { id: identityProvider.userId },
			})

			if (!employee) {
				throw new UnauthorizedException('Employee not found')
			}

			// Dev mode override: accept any device if deviceId is set to '*'
			if (process.env.NODE_ENV === 'development' && employee.deviceId === '*') {
				return true
			}

			if (!deviceId) return false

			return employee.deviceId === deviceId
		}

		throw new UnauthorizedException('User type not recognized')
	}

	private async findUser(
		identityProvider: IdentityProvider,
	): Promise<Client | Employee> {
		if (identityProvider.userType === 'CLIENT') {
			const client = await this.prismaService.client.findUnique({
				where: { id: identityProvider.userId },
			})

			if (!client) {
				throw new UnauthorizedException('Client not found')
			}

			return client
		}

		if (identityProvider.userType === 'EMPLOYEE') {
			const employee = await this.prismaService.employee.findUnique({
				where: { id: identityProvider.userId },
			})

			if (!employee) {
				throw new UnauthorizedException('Employee not found')
			}

			return employee
		}

		throw new UnauthorizedException('User type not recognized')
	}

	private async findBetterAuthUser(userId: string) {
		return await this.prismaService.user.findUnique({
			where: { id: userId },
		})
	}

	private extractToken(req: RequestWithUser): string | undefined {
		return req.headers.authorization?.split(' ').pop()
	}

	private async verifyToken(token: string) {
		try {
			// Use better-auth's built-in verification
			const session = await this.auth.api.getSession({
				headers: {
					authorization: `Bearer ${token}`,
				},
			})

			return session
		} catch (error) {
			console.error('Error verifying token with better-auth:', error)
			// Fallback to direct database lookup
			const session = await this.prismaService.session.findUnique({
				where: { token },
			})

			return session
		}
	}
}
