import { Property } from './property'
import { PropertyStatus } from './value-objects/property-status'
import { PropertyType } from './value-objects/property-type'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { InvalidPropertyStatusTransitionError } from '@/domain/property-management/application/use-cases/errors/invalid-property-status-transition-error'

const makePropertyEntity = (initialStatus = 'VACANT') =>
	Property.create({
		managerId: new UniqueEntityId(),
		address: '123 Main St',
		city: 'Austin',
		state: 'TX',
		zipCode: '78701',
		propertyType: PropertyType.create('APARTMENT'),
		bedrooms: 2,
		bathrooms: 1,
		rentAmount: 1500,
		status: PropertyStatus.create(initialStatus),
	})

describe('Property entity status transitions', () => {
	it('should allow VACANT -> LISTED transition', () => {
		const property = makePropertyEntity('VACANT')
		expect(() => {
			property.status = 'LISTED'
		}).not.toThrow()
		expect(property.status).toBe('LISTED')
	})

	it('should allow VACANT -> OCCUPIED transition', () => {
		const property = makePropertyEntity('VACANT')
		expect(() => {
			property.status = 'OCCUPIED'
		}).not.toThrow()
		expect(property.status).toBe('OCCUPIED')
	})

	it('should allow LISTED -> OCCUPIED transition', () => {
		const property = makePropertyEntity('LISTED')
		expect(() => {
			property.status = 'OCCUPIED'
		}).not.toThrow()
		expect(property.status).toBe('OCCUPIED')
	})

	it('should allow LISTED -> VACANT transition', () => {
		const property = makePropertyEntity('LISTED')
		expect(() => {
			property.status = 'VACANT'
		}).not.toThrow()
		expect(property.status).toBe('VACANT')
	})

	it('should allow OCCUPIED -> VACANT transition', () => {
		const property = makePropertyEntity('OCCUPIED')
		expect(() => {
			property.status = 'VACANT'
		}).not.toThrow()
		expect(property.status).toBe('VACANT')
	})

	it('should throw InvalidPropertyStatusTransitionError on OCCUPIED -> LISTED', () => {
		const property = makePropertyEntity('OCCUPIED')
		expect(() => {
			property.status = 'LISTED'
		}).toThrow(InvalidPropertyStatusTransitionError)
	})

	it('should throw InvalidPropertyStatusTransitionError on VACANT -> MAINTENANCE', () => {
		const property = makePropertyEntity('VACANT')
		expect(() => {
			property.status = 'MAINTENANCE'
		}).toThrow(InvalidPropertyStatusTransitionError)
	})

	it('should allow creating a new entity with any initial status (bypasses setter)', () => {
		const occupied = makePropertyEntity('OCCUPIED')
		expect(occupied.status).toBe('OCCUPIED')

		const maintenance = makePropertyEntity('MAINTENANCE')
		expect(maintenance.status).toBe('MAINTENANCE')
	})
})
