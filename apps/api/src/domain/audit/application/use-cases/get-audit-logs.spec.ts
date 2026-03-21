import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { AuditLog } from '../../enterprise/entities/audit-log'
import { InMemoryAuditLogsRepository } from 'test/repositories/prisma/in-memory-audit-logs-repository'
import { GetAuditLogsUseCase } from './get-audit-logs'

let inMemoryAuditLogsRepository: InMemoryAuditLogsRepository
let sut: GetAuditLogsUseCase

function makeAuditLog(
	overrides: Partial<Parameters<typeof AuditLog.create>[0]> = {},
) {
	return AuditLog.create({
		actorId: new UniqueEntityId('actor-1'),
		actorType: 'manager',
		action: 'CREATE',
		resourceType: 'PROPERTY',
		resourceId: new UniqueEntityId('resource-1'),
		metadata: null,
		...overrides,
	})
}

describe('Get audit logs', () => {
	beforeEach(() => {
		inMemoryAuditLogsRepository = new InMemoryAuditLogsRepository()
		sut = new GetAuditLogsUseCase(inMemoryAuditLogsRepository)
	})

	it('should return all audit logs paginated', async () => {
		for (let i = 0; i < 5; i++) {
			inMemoryAuditLogsRepository.items.push(makeAuditLog())
		}

		const result = await sut.execute({ page: 1, pageSize: 3 })

		expect(result.isRight()).toBeTruthy()
		if (result.isRight()) {
			expect(result.value.auditLogs).toHaveLength(3)
			expect(result.value.totalCount).toBe(5)
		}
	})

	it('should filter by resourceType', async () => {
		inMemoryAuditLogsRepository.items.push(
			makeAuditLog({ resourceType: 'PROPERTY' }),
			makeAuditLog({ resourceType: 'LEASE' }),
			makeAuditLog({ resourceType: 'PROPERTY' }),
		)

		const result = await sut.execute({
			resourceType: 'PROPERTY',
			page: 1,
			pageSize: 20,
		})

		expect(result.isRight()).toBeTruthy()
		if (result.isRight()) {
			expect(result.value.auditLogs).toHaveLength(2)
		}
	})

	it('should filter by action', async () => {
		inMemoryAuditLogsRepository.items.push(
			makeAuditLog({ action: 'CREATE' }),
			makeAuditLog({ action: 'UPDATE' }),
			makeAuditLog({ action: 'CREATE' }),
		)

		const result = await sut.execute({
			action: 'CREATE',
			page: 1,
			pageSize: 20,
		})

		expect(result.isRight()).toBeTruthy()
		if (result.isRight()) {
			expect(result.value.auditLogs).toHaveLength(2)
		}
	})

	it('should filter by actorId', async () => {
		inMemoryAuditLogsRepository.items.push(
			makeAuditLog({ actorId: new UniqueEntityId('actor-1') }),
			makeAuditLog({ actorId: new UniqueEntityId('actor-2') }),
		)

		const result = await sut.execute({
			actorId: 'actor-1',
			page: 1,
			pageSize: 20,
		})

		expect(result.isRight()).toBeTruthy()
		if (result.isRight()) {
			expect(result.value.auditLogs).toHaveLength(1)
		}
	})
})
