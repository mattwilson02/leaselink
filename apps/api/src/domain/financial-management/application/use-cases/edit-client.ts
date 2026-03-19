import { Either, left, right } from '@/core/either'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { Client } from '@/domain/financial-management/enterprise/entities/client'
import { Injectable } from '@nestjs/common'
import { ClientStatus } from '../../enterprise/entities/value-objects/client-status'
import { OnboardingStatus } from '../../enterprise/entities/value-objects/onboarding-status'
import { ClientsRepository } from '../repositories/clients-repository'
import { ClientNotFoundError } from './errors/client-not-found-error'
import { InvalidClientOnboardingStatusError } from './errors/invalid-client-onbooarding-status-error'
import { InvalidClientStatusError } from './errors/invalid-client-status-error'

export interface EditClientUseCaseRequest {
	id: string
	status?: string
	onboardingStatus?: string
	deviceId?: string
	pushToken?: string | null
}

type EditClientUseCaseResponse = Either<
	| ClientNotFoundError
	| InvalidClientStatusError
	| InvalidClientOnboardingStatusError,
	{
		client: Client
	}
>

@Injectable()
export class EditClientUseCase {
	constructor(private clientsRepository: ClientsRepository) {}

	async execute({
		id,
		status,
		onboardingStatus,
		deviceId,
		pushToken,
	}: EditClientUseCaseRequest): Promise<EditClientUseCaseResponse> {
		const client = await this.clientsRepository.findById(id)

		if (!client) {
			return left(new ClientNotFoundError())
		}

		if (status) {
			const isValidStatus = ClientStatus.isValidStatus(status)
			if (!isValidStatus) {
				return left(new InvalidClientStatusError(status))
			}
			const clientStatus = ClientStatus.create(status)
			client.status = clientStatus.value
		}

		if (onboardingStatus) {
			const isValidOnboardingStatus =
				OnboardingStatus.isValidStatus(onboardingStatus)
			if (!isValidOnboardingStatus) {
				return left(new InvalidClientOnboardingStatusError(onboardingStatus))
			}
			const clientOnboardingStatus = OnboardingStatus.create(onboardingStatus)
			client.onboardingStatus = clientOnboardingStatus.value
		}

		if (deviceId) {
			const validDeviceId = new UniqueEntityId(deviceId)

			client.deviceId = validDeviceId
		}

		if (pushToken !== undefined) {
			client.pushToken = pushToken
		}

		await this.clientsRepository.update(client)

		return right({
			client,
		})
	}
}
