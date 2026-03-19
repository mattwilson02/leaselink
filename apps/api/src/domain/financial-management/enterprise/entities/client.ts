import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { Optional } from '@/core/types/optional'
import { Person, PersonProps } from './person'
import { ClientStatus, ClientStatusType } from './value-objects/client-status'
import {
	OnboardingStatus,
	OnboardingStatusType,
} from './value-objects/onboarding-status'

export interface ClientProps extends PersonProps {
	status: ClientStatus
	onboardingStatus: OnboardingStatus
	phoneNumber: string
	managedBy?: UniqueEntityId[]
	pushToken?: string | null
	receivesEmailNotifications?: boolean
	receivesPushNotifications?: boolean
	receivesNotificationsForPortfolio?: boolean
	receivesNotificationsForDocuments?: boolean
	onboardingToken?: string | null
	profilePhoto?: string | null
}

export class Client extends Person<ClientProps> {
	get status() {
		return this.props.status.value
	}
	set status(status: ClientStatusType) {
		this.props.status = ClientStatus.create(status)
		this.touch()
	}

	get onboardingStatus() {
		return this.props.onboardingStatus.value
	}
	set onboardingStatus(status: OnboardingStatusType) {
		this.props.onboardingStatus = OnboardingStatus.create(status)
		this.touch()
	}

	get phoneNumber() {
		return this.props.phoneNumber
	}
	set phoneNumber(phoneNumber: string) {
		this.props.phoneNumber = phoneNumber
		this.touch()
	}

	get pushToken() {
		return this.props.pushToken ?? null
	}

	set pushToken(pushToken: string | null) {
		this.props.pushToken = pushToken
		this.touch()
	}

	get onboardingToken() {
		return this.props.onboardingToken ?? null
	}

	set onboardingToken(onboardingToken: string | null) {
		this.props.onboardingToken = onboardingToken
		this.touch()
	}

	get profilePhoto() {
		return this.props.profilePhoto ?? null
	}

	set profilePhoto(profilePhoto: string | null) {
		this.props.profilePhoto = profilePhoto
		this.touch()
	}

	get managedBy() {
		return this.props.managedBy?.map((id) => id.toString())
	}

	get receivesEmailNotifications() {
		return this.props.receivesEmailNotifications ?? false
	}

	set receivesEmailNotifications(value: boolean) {
		this.props.receivesEmailNotifications = value
		this.touch()
	}

	get receivesPushNotifications() {
		return this.props.receivesPushNotifications ?? false
	}

	set receivesPushNotifications(value: boolean) {
		this.props.receivesPushNotifications = value
		this.touch()
	}

	get receivesNotificationsForPortfolio() {
		return this.props.receivesNotificationsForPortfolio ?? false
	}

	set receivesNotificationsForPortfolio(value: boolean) {
		this.props.receivesNotificationsForPortfolio = value
		this.touch()
	}
	get receivesNotificationsForDocuments() {
		return this.props.receivesNotificationsForDocuments ?? false
	}

	set receivesNotificationsForDocuments(value: boolean) {
		this.props.receivesNotificationsForDocuments = value
		this.touch()
	}

	private addManagedBy(userId: UniqueEntityId) {
		if (!this.props.managedBy?.some((id) => id.equals(userId))) {
			this.props.managedBy = [...(this.props.managedBy ?? []), userId]
			this.touch()
		}
	}

	static create(
		props: Optional<ClientProps, 'createdAt' | 'status' | 'onboardingStatus'>,
		id?: UniqueEntityId,
	) {
		const client = new Client(
			{
				...props,
				status:
					props?.status instanceof ClientStatus
						? props.status
						: ClientStatus.create(props?.status ?? 'INVITED'),
				onboardingStatus:
					props?.onboardingStatus instanceof OnboardingStatus
						? props.onboardingStatus
						: OnboardingStatus.create(props?.onboardingStatus ?? 'NEW'),
				createdAt: props?.createdAt ?? new Date(),
			},
			id,
		)

		return client
	}
}
