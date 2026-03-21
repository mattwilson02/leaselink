import { Entity } from '@/core/entities/entity'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { Optional } from '@/core/types/optional'

export interface SignatureProps {
	documentId: UniqueEntityId
	signedBy: UniqueEntityId
	signatureImageKey: string
	ipAddress: string | null
	userAgent: string | null
	signedAt: Date
}

export class Signature extends Entity<SignatureProps> {
	get documentId() {
		return this.props.documentId
	}

	get signedBy() {
		return this.props.signedBy
	}

	get signatureImageKey() {
		return this.props.signatureImageKey
	}

	get ipAddress() {
		return this.props.ipAddress
	}

	get userAgent() {
		return this.props.userAgent
	}

	get signedAt() {
		return this.props.signedAt
	}

	static create(
		props: Optional<SignatureProps, 'signedAt'>,
		id?: UniqueEntityId,
	) {
		return new Signature(
			{
				...props,
				signedAt: props.signedAt ?? new Date(),
			},
			id,
		)
	}
}
