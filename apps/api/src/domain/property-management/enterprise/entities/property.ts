import { Entity } from '@/core/entities/entity'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { Optional } from '@/core/types/optional'
import {
	PropertyStatus,
	PropertyStatusType,
} from './value-objects/property-status'
import { PropertyType, PropertyTypeValue } from './value-objects/property-type'
import { InvalidPropertyStatusTransitionError } from '@/domain/property-management/application/use-cases/errors/invalid-property-status-transition-error'

const VALID_PROPERTY_TRANSITIONS: Record<
	PropertyStatusType,
	PropertyStatusType[]
> = {
	// biome-ignore lint/style/useNamingConvention: keys must match PropertyStatusType enum values
	VACANT: ['LISTED', 'OCCUPIED'],
	// biome-ignore lint/style/useNamingConvention: keys must match PropertyStatusType enum values
	LISTED: ['VACANT', 'OCCUPIED'],
	// biome-ignore lint/style/useNamingConvention: keys must match PropertyStatusType enum values
	OCCUPIED: ['VACANT', 'MAINTENANCE'],
	// biome-ignore lint/style/useNamingConvention: keys must match PropertyStatusType enum values
	MAINTENANCE: ['VACANT', 'LISTED'],
}

export interface PropertyProps {
	managerId: UniqueEntityId
	address: string
	city: string
	state: string
	zipCode: string
	propertyType: PropertyType
	bedrooms: number
	bathrooms: number
	sqft: number | null
	rentAmount: number
	status: PropertyStatus
	description: string | null
	photos: string[]
	createdAt: Date
	updatedAt?: Date | null
}

export class Property extends Entity<PropertyProps> {
	get managerId() {
		return this.props.managerId
	}

	get address() {
		return this.props.address
	}
	set address(value: string) {
		this.props.address = value
		this.touch()
	}

	get city() {
		return this.props.city
	}
	set city(value: string) {
		this.props.city = value
		this.touch()
	}

	get state() {
		return this.props.state
	}
	set state(value: string) {
		this.props.state = value
		this.touch()
	}

	get zipCode() {
		return this.props.zipCode
	}
	set zipCode(value: string) {
		this.props.zipCode = value
		this.touch()
	}

	get propertyType(): PropertyTypeValue {
		return this.props.propertyType.value
	}
	set propertyType(value: PropertyTypeValue) {
		this.props.propertyType = PropertyType.create(value)
		this.touch()
	}

	get bedrooms() {
		return this.props.bedrooms
	}
	set bedrooms(value: number) {
		this.props.bedrooms = value
		this.touch()
	}

	get bathrooms() {
		return this.props.bathrooms
	}
	set bathrooms(value: number) {
		this.props.bathrooms = value
		this.touch()
	}

	get sqft() {
		return this.props.sqft
	}
	set sqft(value: number | null) {
		this.props.sqft = value
		this.touch()
	}

	get rentAmount() {
		return this.props.rentAmount
	}
	set rentAmount(value: number) {
		this.props.rentAmount = value
		this.touch()
	}

	get status(): PropertyStatusType {
		return this.props.status.value
	}
	set status(value: PropertyStatusType) {
		const current = this.props.status?.value
		if (current !== undefined) {
			const allowed = VALID_PROPERTY_TRANSITIONS[current]
			if (!allowed.includes(value)) {
				throw new InvalidPropertyStatusTransitionError(current, value)
			}
		}
		this.props.status = PropertyStatus.create(value)
		this.touch()
	}

	get description() {
		return this.props.description
	}
	set description(value: string | null) {
		this.props.description = value
		this.touch()
	}

	get photos() {
		return this.props.photos
	}
	set photos(value: string[]) {
		this.props.photos = value
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
			PropertyProps,
			'createdAt' | 'status' | 'photos' | 'description' | 'sqft'
		>,
		id?: UniqueEntityId,
	) {
		const property = new Property(
			{
				...props,
				status:
					props?.status instanceof PropertyStatus
						? props.status
						: PropertyStatus.create(
								(props?.status as unknown as string) ?? 'VACANT',
							),
				photos: props?.photos ?? [],
				description: props?.description ?? null,
				sqft: props?.sqft ?? null,
				createdAt: props?.createdAt ?? new Date(),
			},
			id,
		)
		return property
	}
}
