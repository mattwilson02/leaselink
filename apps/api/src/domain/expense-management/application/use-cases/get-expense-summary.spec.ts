import { InMemoryExpensesRepository } from 'test/repositories/prisma/in-memory-expenses-repository'
import { GetExpenseSummaryUseCase } from './get-expense-summary'
import { makeExpense } from 'test/factories/make-expense'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'

let expensesRepository: InMemoryExpensesRepository
let sut: GetExpenseSummaryUseCase

describe('GetExpenseSummary', () => {
	beforeEach(() => {
		expensesRepository = new InMemoryExpensesRepository()
		sut = new GetExpenseSummaryUseCase(expensesRepository)
	})

	it('should aggregate by property', async () => {
		const managerId = 'manager-1'
		const managerIdObj = new UniqueEntityId(managerId)
		const propA = new UniqueEntityId('property-a')
		const propB = new UniqueEntityId('property-b')

		expensesRepository.propertyAddresses.set('property-a', '123 Main St')
		expensesRepository.propertyAddresses.set('property-b', '456 Oak Ave')

		await expensesRepository.create(
			makeExpense({
				managerId: managerIdObj,
				propertyId: propA,
				amount: 200,
				expenseDate: new Date('2026-03-05'),
			}),
		)
		await expensesRepository.create(
			makeExpense({
				managerId: managerIdObj,
				propertyId: propA,
				amount: 150,
				expenseDate: new Date('2026-03-10'),
			}),
		)
		await expensesRepository.create(
			makeExpense({
				managerId: managerIdObj,
				propertyId: propA,
				amount: 150,
				expenseDate: new Date('2026-03-15'),
			}),
		)
		await expensesRepository.create(
			makeExpense({
				managerId: managerIdObj,
				propertyId: propB,
				amount: 200,
				expenseDate: new Date('2026-03-20'),
			}),
		)

		const result = await sut.execute({
			managerId,
			startDate: new Date('2026-03-01'),
			endDate: new Date('2026-03-31'),
		})

		expect(result.isRight()).toBeTruthy()
		if (result.isRight()) {
			const { summary } = result.value
			expect(summary).toHaveLength(2)

			const propASummary = summary.find((s) => s.propertyId === 'property-a')
			expect(propASummary).toBeDefined()
			expect(propASummary?.totalAmount).toBe(500)
			expect(propASummary?.count).toBe(3)

			const propBSummary = summary.find((s) => s.propertyId === 'property-b')
			expect(propBSummary).toBeDefined()
			expect(propBSummary?.totalAmount).toBe(200)
			expect(propBSummary?.count).toBe(1)
		}
	})

	it('should filter by date range', async () => {
		const managerId = 'manager-1'
		const managerIdObj = new UniqueEntityId(managerId)
		const propA = new UniqueEntityId('property-a')

		await expensesRepository.create(
			makeExpense({
				managerId: managerIdObj,
				propertyId: propA,
				amount: 100,
				expenseDate: new Date('2026-01-15'),
			}),
		)
		await expensesRepository.create(
			makeExpense({
				managerId: managerIdObj,
				propertyId: propA,
				amount: 200,
				expenseDate: new Date('2026-02-15'),
			}),
		)

		const result = await sut.execute({
			managerId,
			startDate: new Date('2026-01-01'),
			endDate: new Date('2026-01-31'),
		})

		expect(result.isRight()).toBeTruthy()
		if (result.isRight()) {
			const { summary } = result.value
			expect(summary).toHaveLength(1)
			expect(summary[0].totalAmount).toBe(100)
		}
	})
})
