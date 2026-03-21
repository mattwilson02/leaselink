import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { Expense } from '../../enterprise/entities/expense'
import { ExpensesRepository } from '../repositories/expenses-repository'
import { PropertiesRepository } from '@/domain/property-management/application/repositories/properties-repository'
import { MaintenanceRequestsRepository } from '@/domain/maintenance/application/repositories/maintenance-requests-repository'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { ExpensePropertyNotFoundError } from './errors/expense-property-not-found-error'
import { ExpenseNotFoundError } from './errors/expense-not-found-error'

export interface CreateExpenseUseCaseRequest {
	managerId: string
	propertyId: string
	category: string
	amount: number
	description: string
	expenseDate: Date
	maintenanceRequestId?: string
}

type CreateExpenseUseCaseResponse = Either<
	ExpensePropertyNotFoundError | ExpenseNotFoundError,
	{ expense: Expense }
>

@Injectable()
export class CreateExpenseUseCase {
	constructor(
		private expensesRepository: ExpensesRepository,
		private propertiesRepository: PropertiesRepository,
		private maintenanceRequestsRepository: MaintenanceRequestsRepository,
	) {}

	async execute(
		request: CreateExpenseUseCaseRequest,
	): Promise<CreateExpenseUseCaseResponse> {
		const property = await this.propertiesRepository.findById(
			request.propertyId,
		)

		if (!property || property.managerId.toString() !== request.managerId) {
			return left(new ExpensePropertyNotFoundError())
		}

		let maintenanceRequestId: UniqueEntityId | null = null

		if (request.maintenanceRequestId) {
			const maintenanceRequest =
				await this.maintenanceRequestsRepository.findById(
					request.maintenanceRequestId,
				)

			if (
				!maintenanceRequest ||
				maintenanceRequest.propertyId.toString() !== request.propertyId
			) {
				return left(new ExpenseNotFoundError())
			}

			maintenanceRequestId = maintenanceRequest.id
		}

		const expense = Expense.create({
			managerId: new UniqueEntityId(request.managerId),
			propertyId: new UniqueEntityId(request.propertyId),
			maintenanceRequestId,
			category: request.category as any,
			amount: request.amount,
			description: request.description,
			expenseDate: request.expenseDate,
		})

		await this.expensesRepository.create(expense)

		return right({ expense })
	}
}
