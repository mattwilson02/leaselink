import { Optional } from '@/core/types/optional'
import {
	Client,
	Employee,
	IdentityProvider,
	User as BetterAuthUser,
} from '@prisma/client'

type CompleteUserResponse = {
	id: string
	name: string
	email: string
	createdAt: string
	updatedAt: string | null
	type: 'CLIENT' | 'EMPLOYEE'
	status: string
	onboardingStatus: string
	phoneNumber: string
	phoneVerified: boolean
	role: string
	authUserId: string
	isDeviceRecognized: boolean
	receivesEmailNotifications?: boolean
	receivesPushNotifications?: boolean
	receivesNotificationsForMaintenance?: boolean
	receivesNotificationsForDocuments?: boolean
}

type ClientUserResponse = Optional<CompleteUserResponse, 'role'> & {
	type: 'CLIENT'
}
type EmployeeUserResponse = Optional<
	CompleteUserResponse,
	'status' | 'phoneNumber' | 'phoneVerified' | 'onboardingStatus'
> & { type: 'EMPLOYEE' }

export type HttpUserResponse = ClientUserResponse | EmployeeUserResponse

export class HttpUserPresenter {
	private static maskPhoneNumber(phoneNumber: string): string {
		if (phoneNumber.length <= 4) {
			return phoneNumber
		}
		const lastFourDigits = phoneNumber.slice(-4)
		const maskedPart = '*'.repeat(phoneNumber.length - 4)
		return maskedPart + lastFourDigits
	}

	static toHTTP(
		entity: Client | Employee,
		identityProvider: IdentityProvider,
		betterAuthUser: BetterAuthUser,
		isDeviceRecognized: boolean,
	): HttpUserResponse {
		const baseUser = {
			id: entity.id,
			name: entity.name,
			email: entity.email,
			createdAt: entity.createdAt.toISOString(),
			updatedAt: entity.updatedAt ? entity.updatedAt.toISOString() : null,
			authUserId: identityProvider.providerUserId,
			isDeviceRecognized,
		}

		if ('status' in entity && 'phoneNumber' in entity) {
			return {
				...baseUser,
				type: 'CLIENT',
				status: entity.status,
				onboardingStatus: entity.onboardingStatus,
				phoneNumber: HttpUserPresenter.maskPhoneNumber(entity.phoneNumber),
				phoneVerified: !!betterAuthUser.phoneNumberVerified,
				receivesEmailNotifications: entity.receivesEmailNotifications,
				receivesPushNotifications: entity.receivesPushNotifications,
				receivesNotificationsForMaintenance:
					entity.receivesNotificationsForMaintenance,
				receivesNotificationsForDocuments:
					entity.receivesNotificationsForDocuments,
			}
		}

		if ('role' in entity) {
			return {
				...baseUser,
				type: 'EMPLOYEE',
				role: entity.role,
			}
		}

		throw new Error('Unknown entity type')
	}
}
