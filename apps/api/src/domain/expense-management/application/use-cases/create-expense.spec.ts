import { InMemoryExpensesRepository } from 'test/repositories/prisma/in-memory-expenses-repository'
import { InMemoryPropertiesRepository } from 'test/repositories/prisma/in-memory-properties-repository'
import { CreateExpenseUseCase } from './create-expense'
import { makeProperty } from 'test/factories/make-property'
import { makeMaintenanceRequest } from 'test/factories/make-maintenance-request'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { ExpensePropertyNotFoundError } from './errors/expense-property-not-found-error'
import { ExpenseNotFoundError } from './errors/expense-not-found-error'

// Minimal in-memory maintenance repo for tests
class InMemoryMaintenanceRequestsRepository {
	public items: any[] = []
	async findById(id: string) {
		return this.items.find((r) => r.id.toString() === id) ?? null
	}
	async create(r: any) {
		this.items.push(r)
	}
	async findMany() {
		return { requests: [], totalCount: 0 }
	}
	async findManyByProperty() {
		return { requests: [], totalCount: 0 }
	}
	async findManyByTenant() {
		return { requests: [], totalCount: 0 }
	}
	async update(r: any) {
		return r
	}
}

let expensesRepository: InMemoryExpensesRepository
let propertiesRepository: InMemoryPropertiesRepository
let maintenanceRequestsRepository: InMemoryMaintenanceRequestsRepository
let sut: CreateExpenseUseCase

describe('CreateExpense', () => {
	beforeEach(() => {
		expensesRepository = new InMemoryExpensesRepository()
		propertiesRepository = new InMemoryPropertiesRepository()
		maintenanceRequestsRepository = new InMemoryMaintenanceRequestsRepository()
		sut = new CreateExpenseUseCase(
			expensesRepository,
			propertiesRepository,
			maintenanceRequestsRepository as any,
		)
	})

	it('should create expense', async () => {
		const managerId = 'manager-1'
		const property = makeProperty({ managerId: new UniqueEntityId(managerId) })
		await propertiesRepository.create(property)

		const result = await sut.execute({
			managerId,
			propertyId: property.id.toString(),
			category: 'MAINTENANCE',
			amount: 500,
			description: 'Plumber visit',
			expenseDate: new Date('2026-03-01'),
		})

		expect(result.isRight()).toBeTruthy()
		expect(expensesRepository.items).toHaveLength(1)
		if (result.isRight()) {
			expect(result.value.expense.amount).toBe(500)
			expect(result.value.expense.category).toBe('MAINTENANCE')
		}
	})

	it('should reject if property not found', async () => {
		const result = await sut.execute({
			managerId: 'manager-1',
			propertyId: 'non-existent',
			category: 'MAINTENANCE',
			amount: 500,
			description: 'Test',
			expenseDate: new Date(),
		})

		expect(result.isLeft()).toBeTruthy()
		expect(result.value).toBeInstanceOf(ExpensePropertyNotFoundError)
	})

	it('should reject if manager does not own property', async () => {
		const property = makeProperty({
			managerId: new UniqueEntityId('manager-a'),
		})
		await propertiesRepository.create(property)

		const result = await sut.execute({
			managerId: 'manager-b',
			propertyId: property.id.toString(),
			category: 'MAINTENANCE',
			amount: 500,
			description: 'Test',
			expenseDate: new Date(),
		})

		expect(result.isLeft()).toBeTruthy()
		expect(result.value).toBeInstanceOf(ExpensePropertyNotFoundError)
	})

	it('should create with maintenance request link', async () => {
		const managerId = 'manager-1'
		const property = makeProperty({ managerId: new UniqueEntityId(managerId) })
		await propertiesRepository.create(property)

		const request = makeMaintenanceRequest({
			propertyId: property.id,
		})
		await maintenanceRequestsRepository.create(request)

		const result = await sut.execute({
			managerId,
			propertyId: property.id.toString(),
			category: 'MAINTENANCE',
			amount: 500,
			description: 'Plumber from maintenance request',
			expenseDate: new Date(),
			maintenanceRequestId: request.id.toString(),
		})

		expect(result.isRight()).toBeTruthy()
		if (result.isRight()) {
			expect(result.value.expense.maintenanceRequestId?.toString()).toBe(
				request.id.toString(),
			)
		}
	})
})
