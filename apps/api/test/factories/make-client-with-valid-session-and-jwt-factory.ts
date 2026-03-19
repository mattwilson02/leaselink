import { UsersAuthRepository } from '@/domain/authentication/application/repositories/user-auth-repository'
import { Injectable } from '@nestjs/common'

@Injectable()
export class ClientWithValidSessionAndJwtFactory {
	constructor(private usersAuthRepository: UsersAuthRepository) {}

	async deleteCreatedClientForJwtFactory(userId: string): Promise<void> {
		await this.usersAuthRepository.delete(userId)
	}
}
