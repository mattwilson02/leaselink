import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import { DeleteClientUseCase } from '@/domain/financial-management/application/use-cases/delete-client'
import {
	BadRequestException,
	Controller,
	Delete,
	HttpCode,
	HttpStatus,
	NotFoundException,
	Param,
	UseGuards,
} from '@nestjs/common'
import {
	ApiBearerAuth,
	ApiOperation,
	ApiParam,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger'
import { ClientNotFoundDTO } from '../../DTOs/client/client-not-found-dto'
import { DeleteClientErrorDTO } from '../../DTOs/client/delete-client-error-dto'
import { OnlyEmployeesCanDeleteClientDTO } from '../../DTOs/employee/only-employees-can-delete-client-dto'
import { EmployeeOnlyGuard } from '../../guards/employee-only.guard'

@ApiTags('Clients')
@Controller('/clients/:clientId')
export class DeleteClientController {
	constructor(private deleteClient: DeleteClientUseCase) {}

	private errorMap = {
		[ResourceNotFoundError.name]: NotFoundException,
	}

	@Delete()
	@HttpCode(HttpStatus.NO_CONTENT)
	@UseGuards(EmployeeOnlyGuard)
	@ApiBearerAuth()
	@ApiOperation({
		summary: 'Delete a client',
		description: 'Deletes a client and all associated records.',
	})
	@ApiParam({
		name: 'clientId',
		type: String,
		description: 'The ID of the client to delete',
		required: true,
	})
	@ApiResponse({
		status: HttpStatus.NO_CONTENT,
		description: 'Client successfully deleted',
		schema: {
			type: 'object',
			properties: {},
			additionalProperties: false,
		},
	})
	@ApiResponse({
		status: HttpStatus.NOT_FOUND,
		description: 'Client not found',
		type: ClientNotFoundDTO,
	})
	@ApiResponse({
		status: HttpStatus.UNAUTHORIZED,
		description: 'Only employees can delete clients',
		type: OnlyEmployeesCanDeleteClientDTO,
	})
	@ApiResponse({
		status: HttpStatus.BAD_REQUEST,
		description: 'Error deleting client',
		type: DeleteClientErrorDTO,
	})
	async handle(@Param('clientId') clientId: string) {
		const response = await this.deleteClient.execute({
			clientId,
		})

		if (response.isLeft()) {
			const error = response.value
			const exception =
				this.errorMap[error.constructor.name] || BadRequestException

			throw new exception(error.message)
		}

		// Return nothing explicitly to ensure 204 No Content
		return
	}
}
