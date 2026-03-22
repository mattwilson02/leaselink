import { InMemoryExpensesRepository } from 'test/repositories/prisma/in-memory-expenses-repository'
import { GetExpenseByIdUseCase } from './get-expense-by-id'
import { makeExpense } from 'test/factories/make-expense'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { ExpenseNotFoundError } from './errors/expense-not-found-error'

let expensesRepository: InMemoryExpensesRepository
let sut: GetExpenseByIdUseCase

describe('GetExpenseById', () => {
	beforeEach(() => {
		expensesRepository = new InMemoryExpensesRepository()
		sut = new GetExpenseByIdUseCase(expensesRepository)
	})

	it('should return expense by id', async () => {
		const managerId = 'manager-1'
		const expense = makeExpense({ managerId: new UniqueEntityId(managerId) })
		await expensesRepository.create(expense)

		const result = await sut.execute({
			expenseId: expense.id.toString(),
			managerId,
		})

		expect(result.isRight()).toBeTruthy()
		if (result.isRight()) {
			expect(result.value.expense.id.toString()).toBe(expense.id.toString())
		}
	})

	it('should return error if not found', async () => {
		const result = await sut.execute({
			expenseId: 'non-existent',
			managerId: 'manager-1',
		})

		expect(result.isLeft()).toBeTruthy()
		expect(result.value).toBeInstanceOf(ExpenseNotFoundError)
	})

	it('should return error if not owner', async () => {
		const expense = makeExpense({ managerId: new UniqueEntityId('manager-a') })
		await expensesRepository.create(expense)

		const result = await sut.execute({
			expenseId: expense.id.toString(),
			managerId: 'manager-b',
		})

		expect(result.isLeft()).toBeTruthy()
		expect(result.value).toBeInstanceOf(ExpenseNotFoundError)
	})
})
