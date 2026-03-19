import { GetLeasesByTenantController } from './get-leases-by-tenant.controller'
import { GetLeasesUseCase } from '@/domain/lease-management/application/use-cases/get-leases'
import { InMemoryLeasesRepository } from 'test/repositories/prisma/in-memory-leases-repository'
import { makeLease } from 'test/factories/make-lease'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { LeaseStatus } from '@/domain/lease-management/enterprise/entities/value-objects/lease-status'
import { UnauthorizedException } from '@nestjs/common'
import type { HttpUserResponse } from '../../presenters/http-user-presenter'

function makeTenantUser(id = 'tenant-1'): HttpUserResponse {
	return {
		id,
		email: 'tenant@test.com',
		name: 'Test Tenant',
		type: 'CLIENT',
	} as HttpUserResponse
}

function makeManagerUser(id = 'manager-1'): HttpUserResponse {
	return {
		id,
		email: 'manager@test.com',
		name: 'Test Manager',
		type: 'EMPLOYEE',
	} as HttpUserResponse
}

describe('GetLeasesByTenantController', () => {
	let leasesRepository: InMemoryLeasesRepository
	let getLeasesUseCase: GetLeasesUseCase
	let sut: GetLeasesByTenantController

	beforeEach(() => {
		leasesRepository = new InMemoryLeasesRepository()
		getLeasesUseCase = new GetLeasesUseCase(leasesRepository)
		sut = new GetLeasesByTenantController(getLeasesUseCase)
	})

	it('returns tenant leases with pagination meta', async () => {
		const tenantId = new UniqueEntityId('tenant-abc')
		const lease = makeLease(
			{ tenantId, status: LeaseStatus.create('ACTIVE') },
			new UniqueEntityId(),
		)
		leasesRepository.items.push(lease)

		const result = await sut.handle(makeTenantUser('tenant-abc'), {
			status: undefined,
			propertyId: undefined,
			tenantId: undefined,
			page: 1,
			pageSize: 20,
		})

		expect(result.data).toHaveLength(1)
		expect(result.data[0].tenantId).toBe('tenant-abc')
		expect(result.meta.totalCount).toBe(1)
		expect(result.meta.page).toBe(1)
		expect(result.meta.pageSize).toBe(20)
		expect(result.meta.totalPages).toBe(1)
	})

	it('returns empty data when tenant has no leases', async () => {
		const result = await sut.handle(makeTenantUser('tenant-xyz'), {
			status: undefined,
			propertyId: undefined,
			tenantId: undefined,
			page: 1,
			pageSize: 20,
		})

		expect(result.data).toHaveLength(0)
		expect(result.meta.totalCount).toBe(0)
	})

	it('filters by status when provided', async () => {
		const tenantId = new UniqueEntityId('tenant-filter')
		leasesRepository.items.push(
			makeLease(
				{ tenantId, status: LeaseStatus.create('ACTIVE') },
				new UniqueEntityId(),
			),
		)
		leasesRepository.items.push(
			makeLease(
				{ tenantId, status: LeaseStatus.create('EXPIRED') },
				new UniqueEntityId(),
			),
		)

		const result = await sut.handle(makeTenantUser('tenant-filter'), {
			status: 'ACTIVE' as any,
			propertyId: undefined,
			tenantId: undefined,
			page: 1,
			pageSize: 20,
		})

		expect(result.data).toHaveLength(1)
		expect(result.data[0].status).toBe('ACTIVE')
	})

	it('only returns leases for the authenticated tenant, not others', async () => {
		const myTenantId = new UniqueEntityId('my-tenant')
		const otherTenantId = new UniqueEntityId('other-tenant')

		leasesRepository.items.push(
			makeLease({ tenantId: myTenantId }, new UniqueEntityId()),
		)
		leasesRepository.items.push(
			makeLease({ tenantId: otherTenantId }, new UniqueEntityId()),
		)

		const result = await sut.handle(makeTenantUser('my-tenant'), {
			status: undefined,
			propertyId: undefined,
			tenantId: undefined,
			page: 1,
			pageSize: 20,
		})

		expect(result.data).toHaveLength(1)
		expect(result.data[0].tenantId).toBe('my-tenant')
	})

	it('throws UnauthorizedException for non-tenant users', async () => {
		await expect(
			sut.handle(makeManagerUser(), {
				status: undefined,
				propertyId: undefined,
				tenantId: undefined,
				page: 1,
				pageSize: 20,
			}),
		).rejects.toThrow(UnauthorizedException)
	})
})
