import { InMemorySessionsRepository } from 'test/repositories/better-auth/in-memory-sessions-repository'
import { CreateSession, CreateSessionRequest } from './create-session'
import { AuthUserType } from '@/domain/financial-management/enterprise/entities/value-objects/auth-user-type'

let inMemorySessionsRepository: InMemorySessionsRepository
let sut: CreateSession

describe('Create session', () => {
	beforeEach(() => {
		inMemorySessionsRepository = new InMemorySessionsRepository()
		sut = new CreateSession(inMemorySessionsRepository)
	})

	it('create a session', async () => {
		const sessionData: CreateSessionRequest = {
			userType: AuthUserType.create({ value: 'CLIENT' }),
		}
		const result = await sut.execute(sessionData)

		expect(result.isRight()).toBeTruthy()
		expect(inMemorySessionsRepository.items).toHaveLength(1)
		expect(result.value).toEqual({
			session: inMemorySessionsRepository.items[0],
		})
	})
})
