import { InMemoryExpensesRepository } from 'test/repositories/prisma/in-memory-expenses-repository'
import { GetExpensesUseCase } from './get-expenses'
import { makeExpense } from 'test/factories/make-expense'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { ExpenseCategory } from '../../enterprise/entities/value-objects/expense-category'

let expensesRepository: InMemoryExpensesRepository
let sut: GetExpensesUseCase

describe('GetExpenses', () => {
	beforeEach(() => {
		expensesRepository = new InMemoryExpensesRepository()
		sut = new GetExpensesUseCase(expensesRepository)
	})

	it('should list expenses for manager', async () => {
		const managerId = 'manager-1'
		const propertyA = new UniqueEntityId('property-a')
		const propertyB = new UniqueEntityId('property-b')
		const managerIdObj = new UniqueEntityId(managerId)

		await expensesRepository.create(
			makeExpense({ managerId: managerIdObj, propertyId: propertyA }),
		)
		await expensesRepository.create(
			makeExpense({ managerId: managerIdObj, propertyId: propertyA }),
		)
		await expensesRepository.create(
			makeExpense({ managerId: managerIdObj, propertyId: propertyB }),
		)
		// Different manager
		await expensesRepository.create(
			makeExpense({ managerId: new UniqueEntityId('manager-2') }),
		)

		const result = await sut.execute({
			managerId,
			page: 1,
			pageSize: 10,
		})

		expect(result.isRight()).toBeTruthy()
		if (result.isRight()) {
			expect(result.value.expenses).toHaveLength(3)
			expect(result.value.totalCount).toBe(3)
		}
	})

	it('should filter by category', async () => {
		const managerId = 'manager-1'
		const managerIdObj = new UniqueEntityId(managerId)

		await expensesRepository.create(
			makeExpense({
				managerId: managerIdObj,
				category: ExpenseCategory.create('MAINTENANCE'),
			}),
		)
		await expensesRepository.create(
			makeExpense({
				managerId: managerIdObj,
				category: ExpenseCategory.create('TAX'),
			}),
		)

		const result = await sut.execute({
			managerId,
			category: 'MAINTENANCE',
			page: 1,
			pageSize: 10,
		})

		expect(result.isRight()).toBeTruthy()
		if (result.isRight()) {
			expect(result.value.expenses).toHaveLength(1)
			expect(result.value.expenses[0].category).toBe('MAINTENANCE')
		}
	})

	it('should filter by date range', async () => {
		const managerId = 'manager-1'
		const managerIdObj = new UniqueEntityId(managerId)

		await expensesRepository.create(
			makeExpense({
				managerId: managerIdObj,
				expenseDate: new Date('2026-01-15'),
			}),
		)
		await expensesRepository.create(
			makeExpense({
				managerId: managerIdObj,
				expenseDate: new Date('2026-02-15'),
			}),
		)

		const result = await sut.execute({
			managerId,
			dateFrom: new Date('2026-01-01'),
			dateTo: new Date('2026-01-31T23:59:59'),
			page: 1,
			pageSize: 10,
		})

		expect(result.isRight()).toBeTruthy()
		if (result.isRight()) {
			expect(result.value.expenses).toHaveLength(1)
		}
	})

	it('should paginate results', async () => {
		const managerId = 'manager-1'
		const managerIdObj = new UniqueEntityId(managerId)

		for (let i = 0; i < 5; i++) {
			await expensesRepository.create(makeExpense({ managerId: managerIdObj }))
		}

		const result = await sut.execute({
			managerId,
			page: 1,
			pageSize: 2,
		})

		expect(result.isRight()).toBeTruthy()
		if (result.isRight()) {
			expect(result.value.expenses).toHaveLength(2)
			expect(result.value.totalCount).toBe(5)
		}
	})
})
