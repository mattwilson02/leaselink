import { Entity } from '@/core/entities/entity'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { Optional } from '@/core/types/optional'
import { LeaseStatus, LeaseStatusType } from './value-objects/lease-status'

export interface LeaseProps {
	propertyId: UniqueEntityId
	tenantId: UniqueEntityId
	startDate: Date
	endDate: Date
	monthlyRent: number
	securityDeposit: number
	earlyTerminationFee?: number | null
	status: LeaseStatus
	renewedFromLeaseId?: UniqueEntityId | null
	createdAt: Date
	updatedAt?: Date | null
}

export class Lease extends Entity<LeaseProps> {
	get propertyId() {
		return this.props.propertyId
	}

	get tenantId() {
		return this.props.tenantId
	}

	get startDate() {
		return this.props.startDate
	}

	set startDate(value: Date) {
		this.props.startDate = value
		this.touch()
	}

	get endDate() {
		return this.props.endDate
	}

	set endDate(value: Date) {
		this.props.endDate = value
		this.touch()
	}

	get monthlyRent() {
		return this.props.monthlyRent
	}

	set monthlyRent(value: number) {
		this.props.monthlyRent = value
		this.touch()
	}

	get securityDeposit() {
		return this.props.securityDeposit
	}

	set securityDeposit(value: number) {
		this.props.securityDeposit = value
		this.touch()
	}

	get earlyTerminationFee(): number | null {
		return this.props.earlyTerminationFee ?? null
	}

	set earlyTerminationFee(value: number | null) {
		this.props.earlyTerminationFee = value
		this.touch()
	}

	get status(): LeaseStatusType {
		return this.props.status.value
	}

	set status(value: LeaseStatusType) {
		this.props.status = LeaseStatus.create(value)
		this.touch()
	}

	get renewedFromLeaseId() {
		return this.props.renewedFromLeaseId ?? null
	}

	get createdAt() {
		return this.props.createdAt
	}

	get updatedAt() {
		return this.props.updatedAt
	}

	private touch() {
		this.props.updatedAt = new Date()
	}

	static create(
		props: Optional<
			LeaseProps,
			'createdAt' | 'status' | 'renewedFromLeaseId' | 'earlyTerminationFee'
		>,
		id?: UniqueEntityId,
	) {
		const lease = new Lease(
			{
				...props,
				status:
					props?.status instanceof LeaseStatus
						? props.status
						: LeaseStatus.create(
								(props?.status as unknown as string) ?? 'PENDING',
							),
				renewedFromLeaseId: props?.renewedFromLeaseId ?? null,
				earlyTerminationFee: props?.earlyTerminationFee ?? null,
				createdAt: props?.createdAt ?? new Date(),
			},
			id,
		)
		return lease
	}
}
