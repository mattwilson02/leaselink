import { InMemoryAuditLogsRepository } from 'test/repositories/prisma/in-memory-audit-logs-repository'
import { CreateAuditLogUseCase } from './create-audit-log'

let inMemoryAuditLogsRepository: InMemoryAuditLogsRepository
let sut: CreateAuditLogUseCase

describe('Create audit log', () => {
	beforeEach(() => {
		inMemoryAuditLogsRepository = new InMemoryAuditLogsRepository()
		sut = new CreateAuditLogUseCase(inMemoryAuditLogsRepository)
	})

	it('should create an audit log', async () => {
		const result = await sut.execute({
			actorId: 'actor-uuid-1',
			actorType: 'manager',
			action: 'CREATE',
			resourceType: 'PROPERTY',
			resourceId: 'resource-uuid-1',
			metadata: { key: 'value' },
		})

		expect(result.isRight()).toBeTruthy()
		expect(inMemoryAuditLogsRepository.items).toHaveLength(1)
		expect(inMemoryAuditLogsRepository.items[0].action).toBe('CREATE')
		expect(inMemoryAuditLogsRepository.items[0].resourceType).toBe('PROPERTY')
		expect(inMemoryAuditLogsRepository.items[0].metadata).toEqual({
			key: 'value',
		})
	})

	it('should create audit log with null metadata when not provided', async () => {
		const result = await sut.execute({
			actorId: 'actor-uuid-1',
			actorType: 'manager',
			action: 'UPDATE',
			resourceType: 'LEASE',
			resourceId: 'resource-uuid-2',
		})

		expect(result.isRight()).toBeTruthy()
		expect(inMemoryAuditLogsRepository.items[0].metadata).toBeNull()
	})

	it('should set createdAt automatically', async () => {
		const before = new Date()
		await sut.execute({
			actorId: 'actor-uuid-1',
			actorType: 'manager',
			action: 'DELETE',
			resourceType: 'EXPENSE',
			resourceId: 'resource-uuid-3',
		})
		const after = new Date()

		const log = inMemoryAuditLogsRepository.items[0]
		expect(log.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime())
		expect(log.createdAt.getTime()).toBeLessThanOrEqual(after.getTime())
	})
})
