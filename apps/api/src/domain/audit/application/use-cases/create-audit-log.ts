import { Either, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { AuditLog } from '../../enterprise/entities/audit-log'
import { AuditLogsRepository } from '../repositories/audit-logs-repository'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'

export interface CreateAuditLogUseCaseRequest {
	actorId: string
	actorType: string
	action: string
	resourceType: string
	resourceId: string
	metadata?: Record<string, unknown>
}

type CreateAuditLogUseCaseResponse = Either<never, { auditLog: AuditLog }>

@Injectable()
export class CreateAuditLogUseCase {
	constructor(private auditLogsRepository: AuditLogsRepository) {}

	async execute(
		request: CreateAuditLogUseCaseRequest,
	): Promise<CreateAuditLogUseCaseResponse> {
		const auditLog = AuditLog.create({
			actorId: new UniqueEntityId(request.actorId),
			actorType: request.actorType,
			action: request.action,
			resourceType: request.resourceType,
			resourceId: new UniqueEntityId(request.resourceId),
			metadata: request.metadata ?? null,
		})

		await this.auditLogsRepository.create(auditLog)

		return right({ auditLog })
	}
}
