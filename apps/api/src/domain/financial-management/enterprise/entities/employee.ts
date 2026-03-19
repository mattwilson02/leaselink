import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { Optional } from '@/core/types/optional'
import { Person, type PersonProps } from './person'
import { Role, RoleType } from './value-objects/role'

export interface EmployeeProps extends PersonProps {
	role: Role
	clients?: UniqueEntityId[]
}

export class Employee extends Person<EmployeeProps> {
	get role() {
		return this.props.role.value
	}
	set role(role: RoleType) {
		this.props.role = Role.create(role)
		this.touch()
	}

	get clients() {
		return this.props.clients?.map((id) => id.toString())
	}
	private addClient(clientId: UniqueEntityId) {
		if (!this.props.clients?.some((id) => id.equals(clientId))) {
			this.props.clients = [...(this.props.clients ?? []), clientId]
			this.touch()
		}
	}

	static create(
		props: Optional<EmployeeProps, 'createdAt' | 'role'>,
		id?: UniqueEntityId,
	) {
		const employee = new Employee(
			{
				...props,
				role:
					props?.role instanceof Role
						? props.role
						: Role.create(props?.role ?? 'SUPPORT'),
				createdAt: props?.createdAt ?? new Date(),
			},
			id,
		)

		return employee
	}
}
