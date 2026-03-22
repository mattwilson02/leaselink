import { InMemoryExpensesRepository } from 'test/repositories/prisma/in-memory-expenses-repository'
import { UpdateExpenseUseCase } from './update-expense'
import { makeExpense } from 'test/factories/make-expense'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { ExpenseNotFoundError } from './errors/expense-not-found-error'

let expensesRepository: InMemoryExpensesRepository
let sut: UpdateExpenseUseCase

describe('UpdateExpense', () => {
	beforeEach(() => {
		expensesRepository = new InMemoryExpensesRepository()
		sut = new UpdateExpenseUseCase(expensesRepository)
	})

	it('should update expense', async () => {
		const managerId = 'manager-1'
		const expense = makeExpense({ managerId: new UniqueEntityId(managerId) })
		await expensesRepository.create(expense)

		const result = await sut.execute({
			expenseId: expense.id.toString(),
			managerId,
			amount: 999,
			description: 'Updated description',
		})

		expect(result.isRight()).toBeTruthy()
		if (result.isRight()) {
			expect(result.value.expense.amount).toBe(999)
			expect(result.value.expense.description).toBe('Updated description')
		}
	})

	it('should reject if not owner', async () => {
		const expense = makeExpense({ managerId: new UniqueEntityId('manager-a') })
		await expensesRepository.create(expense)

		const result = await sut.execute({
			expenseId: expense.id.toString(),
			managerId: 'manager-b',
			amount: 999,
		})

		expect(result.isLeft()).toBeTruthy()
		expect(result.value).toBeInstanceOf(ExpenseNotFoundError)
	})

	it('should return error if not found', async () => {
		const result = await sut.execute({
			expenseId: 'non-existent',
			managerId: 'manager-1',
			amount: 100,
		})

		expect(result.isLeft()).toBeTruthy()
		expect(result.value).toBeInstanceOf(ExpenseNotFoundError)
	})
})
