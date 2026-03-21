import { UploadExpenseReceiptUseCase } from '@/domain/expense-management/application/use-cases/upload-expense-receipt'
import { ExpenseNotFoundError } from '@/domain/expense-management/application/use-cases/errors/expense-not-found-error'
import {
	BadRequestException,
	Body,
	Controller,
	HttpCode,
	HttpStatus,
	NotFoundException,
	Param,
	Post,
	UseGuards,
} from '@nestjs/common'
import {
	ApiBearerAuth,
	ApiBody,
	ApiOperation,
	ApiParam,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger'
import { ZodValidationPipe } from 'nestjs-zod'
import { z } from 'zod'
import { EmployeeOnlyGuard } from '../../guards/employee-only.guard'
import { CurrentUser } from '@/infra/auth/better-auth/current-user.decorator'
import { HttpUserResponse } from '../../presenters/http-user-presenter'

const uploadReceiptSchema = z.object({
	fileName: z.string().min(1),
	contentType: z.string().min(1),
})
type UploadReceiptBody = z.infer<typeof uploadReceiptSchema>
const bodyValidationPipe = new ZodValidationPipe(uploadReceiptSchema)

@ApiTags('Expenses')
@Controller('/expenses')
export class UploadExpenseReceiptController {
	constructor(private uploadExpenseReceipt: UploadExpenseReceiptUseCase) {}

	@Post(':id/receipt')
	@HttpCode(HttpStatus.OK)
	@UseGuards(EmployeeOnlyGuard)
	@ApiBearerAuth()
	@ApiOperation({ summary: 'Generate upload URL for expense receipt' })
	@ApiParam({ name: 'id', description: 'Expense UUID' })
	@ApiBody({
		schema: {
			type: 'object',
			required: ['fileName', 'contentType'],
			properties: {
				fileName: { type: 'string' },
				contentType: { type: 'string' },
			},
		},
	})
	@ApiResponse({ status: HttpStatus.OK, description: 'Upload URL generated' })
	@ApiResponse({
		status: HttpStatus.NOT_FOUND,
		description: 'Expense not found',
	})
	async handle(
		@CurrentUser() user: HttpUserResponse,
		@Param('id') expenseId: string,
		@Body(bodyValidationPipe) body: UploadReceiptBody,
	) {
		const response = await this.uploadExpenseReceipt.execute({
			expenseId,
			managerId: user.id,
			fileName: body.fileName,
			contentType: body.contentType,
		})

		if (response.isLeft()) {
			const error = response.value
			if (error instanceof ExpenseNotFoundError) {
				throw new NotFoundException(error.message)
			}
			throw new BadRequestException(error.message)
		}

		return {
			uploadUrl: response.value.uploadUrl,
			blobKey: response.value.blobKey,
		}
	}
}
