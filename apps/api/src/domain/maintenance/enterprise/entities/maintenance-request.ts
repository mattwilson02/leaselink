import { Entity } from '@/core/entities/entity'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { Optional } from '@/core/types/optional'
import {
	MaintenanceStatus,
	MaintenanceStatusType,
} from './value-objects/maintenance-status'
import {
	MaintenancePriority,
	MaintenancePriorityType,
} from './value-objects/maintenance-priority'
import {
	MaintenanceCategory,
	MaintenanceCategoryType,
} from './value-objects/maintenance-category'

export interface MaintenanceRequestProps {
	propertyId: UniqueEntityId
	tenantId: UniqueEntityId
	vendorId: UniqueEntityId | null
	title: string
	description: string
	priority: MaintenancePriority
	status: MaintenanceStatus
	category: MaintenanceCategory
	photos: string[]
	resolvedAt: Date | null
	createdAt: Date
	updatedAt?: Date | null
}

export class MaintenanceRequest extends Entity<MaintenanceRequestProps> {
	get propertyId() {
		return this.props.propertyId
	}

	get tenantId() {
		return this.props.tenantId
	}

	get vendorId() {
		return this.props.vendorId
	}
	set vendorId(value: UniqueEntityId | null) {
		this.props.vendorId = value
		this.touch()
	}

	get title() {
		return this.props.title
	}
	set title(value: string) {
		this.props.title = value
		this.touch()
	}

	get description() {
		return this.props.description
	}
	set description(value: string) {
		this.props.description = value
		this.touch()
	}

	get priority(): MaintenancePriorityType {
		return this.props.priority.value
	}
	set priority(value: MaintenancePriorityType) {
		this.props.priority = MaintenancePriority.create(value)
		this.touch()
	}

	get status(): MaintenanceStatusType {
		return this.props.status.value
	}
	set status(value: MaintenanceStatusType) {
		this.props.status = MaintenanceStatus.create(value)
		this.touch()
	}

	get category(): MaintenanceCategoryType {
		return this.props.category.value
	}
	set category(value: MaintenanceCategoryType) {
		this.props.category = MaintenanceCategory.create(value)
		this.touch()
	}

	get photos() {
		return this.props.photos
	}
	set photos(value: string[]) {
		this.props.photos = value
		this.touch()
	}

	get resolvedAt() {
		return this.props.resolvedAt
	}
	set resolvedAt(value: Date | null) {
		this.props.resolvedAt = value
		this.touch()
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
			MaintenanceRequestProps,
			'createdAt' | 'status' | 'priority' | 'photos' | 'resolvedAt' | 'vendorId'
		>,
		id?: UniqueEntityId,
	) {
		const request = new MaintenanceRequest(
			{
				...props,
				vendorId: props?.vendorId ?? null,
				status:
					props?.status instanceof MaintenanceStatus
						? props.status
						: MaintenanceStatus.create(
								(props?.status as unknown as string) ?? 'OPEN',
							),
				priority:
					props?.priority instanceof MaintenancePriority
						? props.priority
						: MaintenancePriority.create(
								(props?.priority as unknown as string) ?? 'MEDIUM',
							),
				category:
					props?.category instanceof MaintenanceCategory
						? props.category
						: MaintenanceCategory.create(props?.category as unknown as string),
				photos: props?.photos ?? [],
				resolvedAt: props?.resolvedAt ?? null,
				createdAt: props?.createdAt ?? new Date(),
			},
			id,
		)
		return request
	}
}
