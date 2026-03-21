import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { ExpensesRepository } from '../repositories/expenses-repository'
import { StorageRepository } from '@/domain/document/application/repositories/storage-repository'
import { ExpenseNotFoundError } from './errors/expense-not-found-error'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'

export interface UploadExpenseReceiptUseCaseRequest {
	expenseId: string
	managerId: string
	fileName: string
	contentType: string
}

type UploadExpenseReceiptUseCaseResponse = Either<
	ExpenseNotFoundError | Error,
	{ uploadUrl: string; blobKey: string }
>

@Injectable()
export class UploadExpenseReceiptUseCase {
	constructor(
		private expensesRepository: ExpensesRepository,
		private storageRepository: StorageRepository,
	) {}

	async execute(
		request: UploadExpenseReceiptUseCaseRequest,
	): Promise<UploadExpenseReceiptUseCaseResponse> {
		const expense = await this.expensesRepository.findById(request.expenseId)

		if (!expense || expense.managerId.toString() !== request.managerId) {
			return left(new ExpenseNotFoundError())
		}

		const blobKey = `expenses/${request.expenseId}/receipt/${new UniqueEntityId().toString()}-${request.fileName}`
		const result = await this.storageRepository.generateUploadUrl(
			blobKey,
			request.contentType,
		)

		if (result.isLeft()) {
			return left(result.value)
		}

		return right({ uploadUrl: result.value, blobKey })
	}
}
