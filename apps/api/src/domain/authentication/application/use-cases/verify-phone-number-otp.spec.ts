import { makeClient } from 'test/factories/make-client'
import { InMemoryUsersAuthRepository } from 'test/repositories/better-auth/in-memory-users-auth-repository'
import { InMemoryClientsRepository } from 'test/repositories/prisma/in-memory-clients-repository'
import { VerifyPhoneNumberOtpUseCase } from './verify-phone-number-otp'
import { ClientStatus } from '@/domain/financial-management/enterprise/entities/value-objects/client-status'

let inMemoryClientsRepository: InMemoryClientsRepository
let inMemoryUsersAuthRepository: InMemoryUsersAuthRepository
let sut: VerifyPhoneNumberOtpUseCase

describe('Verify Phone Number OTP', () => {
	beforeEach(() => {
		inMemoryClientsRepository = new InMemoryClientsRepository()
		inMemoryUsersAuthRepository = new InMemoryUsersAuthRepository()
		sut = new VerifyPhoneNumberOtpUseCase(
			inMemoryUsersAuthRepository,
			inMemoryClientsRepository,
		)
	})

	it('should verify OTP successfully', async () => {
		const phoneNumber = '+15551234567'
		const otp = '123456'
		const client = makeClient({
			phoneNumber,
			status: ClientStatus.create('ACTIVE'),
		})
		await inMemoryClientsRepository.create(client)

		const result = await sut.execute({
			clientId: client.id.toString(),
			otp,
		})

		expect(result.isRight()).toBeTruthy()
		if (result.isRight()) {
			expect(result.value).toEqual({
				success: true,
			})
		}
	})

	it('should verify OTP for client during onboarding', async () => {
		const phoneNumber = '+15551234567'
		const otp = '123456'
		const client = makeClient({
			phoneNumber,
			status: ClientStatus.create('INVITED'),
		})
		await inMemoryClientsRepository.create(client)

		const result = await sut.execute({
			clientId: client.id.toString(),
			otp,
		})

		expect(result.isRight()).toBeTruthy()
		if (result.isRight()) {
			expect(result.value).toEqual({
				success: true,
			})
		}
	})

	it('should return error if client is not found', async () => {
		const result = await sut.execute({
			clientId: 'non-existent-id',
			otp: '123456',
		})

		expect(result.isLeft()).toBeTruthy()
		if (result.isLeft()) {
			expect(result.value.constructor.name).toBe('ClientNotFoundError')
		}
	})

	it('should return error if client has no phone number', async () => {
		const client = makeClient({
			phoneNumber: '',
			status: ClientStatus.create('ACTIVE'),
		})
		await inMemoryClientsRepository.create(client)

		const result = await sut.execute({
			clientId: client.id.toString(),
			otp: '123456',
		})

		expect(result.isLeft()).toBeTruthy()
		if (result.isLeft()) {
			expect(result.value.constructor.name).toBe('AuthError')
			expect(result.value.message).toContain('Client phone number not found')
		}
	})
})
