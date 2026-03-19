import { makeUserAuth } from 'test/factories/make-user-auth'
import { InMemoryUsersAuthRepository } from 'test/repositories/better-auth/in-memory-users-auth-repository'
import { VerifyPasswordUseCase } from './verify-password'
import { InvalidPasswordError } from './errors/invalid-password-error'

let inMemoryUsersAuthRepository: InMemoryUsersAuthRepository
let sut: VerifyPasswordUseCase

describe('Verify Password', () => {
	beforeEach(() => {
		inMemoryUsersAuthRepository = new InMemoryUsersAuthRepository()
		sut = new VerifyPasswordUseCase(inMemoryUsersAuthRepository)
	})

	it('should verify password successfully', async () => {
		const password = 'MySecurePassword123!'
		const userAuth = makeUserAuth({ password })
		inMemoryUsersAuthRepository.items.push(userAuth)

		const result = await sut.execute({
			authUserId: userAuth.id.toString(),
			password,
		})

		expect(result.isRight()).toBeTruthy()
		if (result.isRight()) {
			expect(result.value).toEqual({ success: true })
		}
	})

	it('should return error for incorrect password', async () => {
		const userAuth = makeUserAuth({ password: 'CorrectPassword123!' })
		inMemoryUsersAuthRepository.items.push(userAuth)

		const result = await sut.execute({
			authUserId: userAuth.id.toString(),
			password: 'WrongPassword456!',
		})

		expect(result.isLeft()).toBeTruthy()
		expect(result.value).toBeInstanceOf(InvalidPasswordError)
	})

	it('should return error if user does not exist', async () => {
		const result = await sut.execute({
			authUserId: 'non-existent-user-id',
			password: 'AnyPassword123!',
		})

		expect(result.isLeft()).toBeTruthy()
		expect(result.value).toBeInstanceOf(InvalidPasswordError)
	})
})
