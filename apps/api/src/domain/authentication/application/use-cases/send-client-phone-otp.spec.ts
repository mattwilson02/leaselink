import { makeClient } from 'test/factories/make-client'
import { InMemoryUsersAuthRepository } from 'test/repositories/better-auth/in-memory-users-auth-repository'
import { InMemoryClientsRepository } from 'test/repositories/prisma/in-memory-clients-repository'
import { SendClientPhoneOtpUseCase } from './send-client-phone-otp'
import { ClientStatus } from '@/domain/financial-management/enterprise/entities/value-objects/client-status'

let inMemoryClientsRepository: InMemoryClientsRepository
let inMemoryUsersAuthRepository: InMemoryUsersAuthRepository
let sut: SendClientPhoneOtpUseCase

describe('Send Client Phone OTP', () => {
	beforeEach(() => {
		inMemoryClientsRepository = new InMemoryClientsRepository()
		inMemoryUsersAuthRepository = new InMemoryUsersAuthRepository()
		sut = new SendClientPhoneOtpUseCase(
			inMemoryUsersAuthRepository,
			inMemoryClientsRepository,
		)
	})

	describe('Onboarding Flow (status not ACTIVE)', () => {
		it('should send OTP when phone number matches during onboarding', async () => {
			const phoneNumber = '+15551234567'
			const client = makeClient({
				phoneNumber,
				status: ClientStatus.create('INVITED'),
			})
			await inMemoryClientsRepository.create(client)

			const result = await sut.execute({
				clientId: client.id.toString(),
				phoneNumber,
			})

			expect(result.isRight()).toBeTruthy()
			expect(result.value).toEqual({ success: true })
		})

		it('should return error if phone number is not provided during onboarding', async () => {
			const client = makeClient({
				phoneNumber: '+15551234567',
				status: ClientStatus.create('INVITED'),
			})
			await inMemoryClientsRepository.create(client)

			const result = await sut.execute({
				clientId: client.id.toString(),
				// phoneNumber not provided
			})

			expect(result.isLeft()).toBeTruthy()
			if (result.isLeft()) {
				expect(result.value.message).toContain(
					'Phone number is required during onboarding verification',
				)
			}
		})

		it('should return error if phone number does not match during onboarding', async () => {
			const client = makeClient({
				phoneNumber: '+15551234567',
				status: ClientStatus.create('INVITED'),
			})
			await inMemoryClientsRepository.create(client)

			const result = await sut.execute({
				clientId: client.id.toString(),
				phoneNumber: '+15559999999', // Different phone number
			})

			expect(result.isLeft()).toBeTruthy()
			if (result.isLeft()) {
				expect(result.value.constructor.name).toBe('PhoneNumberMismatchError')
			}
		})
	})

	describe('Active User Flow (status ACTIVE)', () => {
		it('should send OTP using phone from database when not provided', async () => {
			const phoneNumber = '+15551234567'
			const client = makeClient({
				phoneNumber,
				status: ClientStatus.create('ACTIVE'),
			})
			await inMemoryClientsRepository.create(client)

			const result = await sut.execute({
				clientId: client.id.toString(),
				// phoneNumber not provided - should use from database
			})

			expect(result.isRight()).toBeTruthy()
			expect(result.value).toEqual({ success: true })
		})

		it('should send OTP when phone number matches for active user', async () => {
			const phoneNumber = '+15551234567'
			const client = makeClient({
				phoneNumber,
				status: ClientStatus.create('ACTIVE'),
			})
			await inMemoryClientsRepository.create(client)

			const result = await sut.execute({
				clientId: client.id.toString(),
				phoneNumber, // Provided and matches
			})

			expect(result.isRight()).toBeTruthy()
			expect(result.value).toEqual({ success: true })
		})

		it('should return error if provided phone number does not match for active user', async () => {
			const client = makeClient({
				phoneNumber: '+15551234567',
				status: ClientStatus.create('ACTIVE'),
			})
			await inMemoryClientsRepository.create(client)

			const result = await sut.execute({
				clientId: client.id.toString(),
				phoneNumber: '+15559999999', // Different phone number
			})

			expect(result.isLeft()).toBeTruthy()
			if (result.isLeft()) {
				expect(result.value.constructor.name).toBe('PhoneNumberMismatchError')
			}
		})
	})

	describe('Common Error Cases', () => {
		it('should return error if client is not found', async () => {
			const result = await sut.execute({
				clientId: 'non-existent-id',
				phoneNumber: '+15551234567',
			})

			expect(result.isLeft()).toBeTruthy()
			if (result.isLeft()) {
				expect(result.value.constructor.name).toBe('ClientNotFoundError')
			}
		})
	})
})
