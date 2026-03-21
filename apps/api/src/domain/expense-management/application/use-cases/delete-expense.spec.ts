import { InMemoryExpensesRepository } from 'test/repositories/prisma/in-memory-expenses-repository'
import { DeleteExpenseUseCase } from './delete-expense'
import { makeExpense } from 'test/factories/make-expense'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { ExpenseNotFoundError } from './errors/expense-not-found-error'

let expensesRepository: InMemoryExpensesRepository
let sut: DeleteExpenseUseCase

describe('DeleteExpense', () => {
	beforeEach(() => {
		expensesRepository = new InMemoryExpensesRepository()
		sut = new DeleteExpenseUseCase(expensesRepository)
	})

	it('should delete expense', async () => {
		const managerId = 'manager-1'
		const expense = makeExpense({ managerId: new UniqueEntityId(managerId) })
		await expensesRepository.create(expense)

		const result = await sut.execute({
			expenseId: expense.id.toString(),
			managerId,
		})

		expect(result.isRight()).toBeTruthy()
		expect(expensesRepository.items).toHaveLength(0)
	})

	it('should reject if not owner', async () => {
		const expense = makeExpense({ managerId: new UniqueEntityId('manager-a') })
		await expensesRepository.create(expense)

		const result = await sut.execute({
			expenseId: expense.id.toString(),
			managerId: 'manager-b',
		})

		expect(result.isLeft()).toBeTruthy()
		expect(result.value).toBeInstanceOf(ExpenseNotFoundError)
		expect(expensesRepository.items).toHaveLength(1)
	})

	it('should return error if not found', async () => {
		const result = await sut.execute({
			expenseId: 'non-existent',
			managerId: 'manager-1',
		})

		expect(result.isLeft()).toBeTruthy()
		expect(result.value).toBeInstanceOf(ExpenseNotFoundError)
	})
})
