import { SessionRepository } from '@/domain/authentication/application/repositories/session-repository'
import { AuthUserType } from '@/domain/financial-management/enterprise/entities/value-objects/auth-user-type'
import { Injectable } from '@nestjs/common'

@Injectable()
export class JwtFactory {
	constructor(private sessionRepository: SessionRepository) {}

	async makeJwt(isClient = false): Promise<{ jwt?: string | null }> {
		const result = await this.sessionRepository.create(
			isClient
				? AuthUserType.create({ value: 'CLIENT' })
				: AuthUserType.create({ value: 'EMPLOYEE' }),
		)

		if (result.isLeft()) {
			return {
				jwt: null,
			}
		}

		return {
			jwt: result.value.token,
		}
	}
}
