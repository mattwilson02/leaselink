import { Entity } from '@/core/entities/entity'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { Optional } from '@/core/types/optional'
import {
	MaintenanceCategory,
	MaintenanceCategoryType,
} from '@/domain/maintenance/enterprise/entities/value-objects/maintenance-category'

export interface VendorProps {
	managerId: UniqueEntityId
	name: string
	specialty: MaintenanceCategory
	phone: string | null
	email: string | null
	notes: string | null
	createdAt: Date
	updatedAt?: Date | null
}

export class Vendor extends Entity<VendorProps> {
	get managerId() {
		return this.props.managerId
	}

	get name() {
		return this.props.name
	}
	set name(value: string) {
		this.props.name = value
		this.touch()
	}

	get specialty(): MaintenanceCategoryType {
		return this.props.specialty.value
	}
	set specialty(value: MaintenanceCategoryType) {
		this.props.specialty = MaintenanceCategory.create(value)
		this.touch()
	}

	get phone() {
		return this.props.phone
	}
	set phone(value: string | null) {
		this.props.phone = value
		this.touch()
	}

	get email() {
		return this.props.email
	}
	set email(value: string | null) {
		this.props.email = value
		this.touch()
	}

	get notes() {
		return this.props.notes
	}
	set notes(value: string | null) {
		this.props.notes = value
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
		props: Optional<VendorProps, 'createdAt' | 'phone' | 'email' | 'notes'>,
		id?: UniqueEntityId,
	) {
		const vendor = new Vendor(
			{
				...props,
				specialty:
					props.specialty instanceof MaintenanceCategory
						? props.specialty
						: MaintenanceCategory.create(props.specialty as unknown as string),
				phone: props.phone ?? null,
				email: props.email ?? null,
				notes: props.notes ?? null,
				createdAt: props.createdAt ?? new Date(),
			},
			id,
		)
		return vendor
	}
}
