import { CreateClientUseCase } from '@/domain/financial-management/application/use-cases/create-client'
import { ClientAlreadyExistsError } from '@/domain/financial-management/application/use-cases/errors/client-already-exists-error'
import {
	BadRequestException,
	Body,
	ConflictException,
	Controller,
	HttpCode,
	HttpStatus,
	Post,
	UseGuards,
} from '@nestjs/common'
import {
	ApiBearerAuth,
	ApiBody,
	ApiOperation,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger'
import { ZodValidationPipe } from 'nestjs-zod'
import { z } from 'zod'
import { ClientAlreadyExistsDTO } from '../../DTOs/client/client-already-exists-dto'
import { CreateClientBadRequestDTO } from '../../DTOs/client/create-client-bad-request-dto'
import { CreateClientRequestDTO } from '../../DTOs/client/create-client-request-dto'
import { OnlyEmployeesCanCreateClientDTO } from '../../DTOs/employee/only-employees-can-create-client-dto'
import { EmployeeOnlyGuard } from '../../guards/employee-only.guard'

const createClientBodySchema = z.object({
	name: z.string(),
	email: z.string().email(),
	phoneNumber: z.string(),
})

type CreateClientBodySchema = z.infer<typeof createClientBodySchema>

const bodyValidationPipe = new ZodValidationPipe(createClientBodySchema)

@ApiTags('Clients')
@Controller('/clients')
export class CreateClientController {
	constructor(private createClient: CreateClientUseCase) {}

	private errorMap = {
		[ClientAlreadyExistsError.name]: ConflictException,
	}

	@Post()
	@HttpCode(HttpStatus.CREATED)
	@UseGuards(EmployeeOnlyGuard)
	@ApiBearerAuth()
	@ApiOperation({
		summary: 'Create a new client',
		description: 'Creates a new client using name, email, and phone number.',
	})
	@ApiBody({
		type: CreateClientRequestDTO,
	})
	@ApiResponse({
		status: HttpStatus.CREATED,
		description: 'Client successfully created',
		schema: {
			type: 'object',
			properties: {},
			additionalProperties: false,
		},
	})
	@ApiResponse({
		status: HttpStatus.BAD_REQUEST,
		description: 'Invalid request body',
		type: CreateClientBadRequestDTO,
	})
	@ApiResponse({
		status: HttpStatus.UNAUTHORIZED,
		description: 'Only employees can create clients',
		type: OnlyEmployeesCanCreateClientDTO,
	})
	@ApiResponse({
		status: HttpStatus.CONFLICT,
		description: 'Client already exists',
		type: ClientAlreadyExistsDTO,
	})
	async handle(@Body(bodyValidationPipe) body: CreateClientBodySchema) {
		const { name, email, phoneNumber } = body

		const response = await this.createClient.execute({
			name,
			email,
			phoneNumber,
		})

		if (response.isLeft()) {
			const error = response.value
			const exception =
				this.errorMap[error.constructor.name] || BadRequestException

			throw new exception(error.message)
		}
	}
}
