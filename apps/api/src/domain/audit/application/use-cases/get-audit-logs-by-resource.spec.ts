import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { AuditLog } from '../../enterprise/entities/audit-log'
import { InMemoryAuditLogsRepository } from 'test/repositories/prisma/in-memory-audit-logs-repository'
import { GetAuditLogsByResourceUseCase } from './get-audit-logs-by-resource'

let inMemoryAuditLogsRepository: InMemoryAuditLogsRepository
let sut: GetAuditLogsByResourceUseCase

describe('Get audit logs by resource', () => {
	beforeEach(() => {
		inMemoryAuditLogsRepository = new InMemoryAuditLogsRepository()
		sut = new GetAuditLogsByResourceUseCase(inMemoryAuditLogsRepository)
	})

	it('should return audit logs for a specific resource', async () => {
		const resourceId = new UniqueEntityId('property-1')

		inMemoryAuditLogsRepository.items.push(
			AuditLog.create({
				actorId: new UniqueEntityId('actor-1'),
				actorType: 'manager',
				action: 'CREATE',
				resourceType: 'PROPERTY',
				resourceId,
				metadata: null,
			}),
			AuditLog.create({
				actorId: new UniqueEntityId('actor-1'),
				actorType: 'manager',
				action: 'UPDATE',
				resourceType: 'PROPERTY',
				resourceId,
				metadata: null,
			}),
			AuditLog.create({
				actorId: new UniqueEntityId('actor-1'),
				actorType: 'manager',
				action: 'CREATE',
				resourceType: 'LEASE',
				resourceId: new UniqueEntityId('lease-1'),
				metadata: null,
			}),
		)

		const result = await sut.execute({
			resourceType: 'PROPERTY',
			resourceId: 'property-1',
			page: 1,
			pageSize: 20,
		})

		expect(result.isRight()).toBeTruthy()
		if (result.isRight()) {
			expect(result.value.auditLogs).toHaveLength(2)
			expect(result.value.totalCount).toBe(2)
		}
	})

	it('should paginate results', async () => {
		const resourceId = new UniqueEntityId('property-1')

		for (let i = 0; i < 5; i++) {
			inMemoryAuditLogsRepository.items.push(
				AuditLog.create({
					actorId: new UniqueEntityId('actor-1'),
					actorType: 'manager',
					action: 'UPDATE',
					resourceType: 'PROPERTY',
					resourceId,
					metadata: null,
				}),
			)
		}

		const result = await sut.execute({
			resourceType: 'PROPERTY',
			resourceId: 'property-1',
			page: 1,
			pageSize: 3,
		})

		expect(result.isRight()).toBeTruthy()
		if (result.isRight()) {
			expect(result.value.auditLogs).toHaveLength(3)
			expect(result.value.totalCount).toBe(5)
		}
	})

	it('should return empty when no logs found', async () => {
		const result = await sut.execute({
			resourceType: 'PROPERTY',
			resourceId: 'non-existent',
			page: 1,
			pageSize: 20,
		})

		expect(result.isRight()).toBeTruthy()
		if (result.isRight()) {
			expect(result.value.auditLogs).toHaveLength(0)
			expect(result.value.totalCount).toBe(0)
		}
	})
})
