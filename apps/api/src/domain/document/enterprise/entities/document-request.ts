import { AggregateRoot } from '@/core/entities/aggregate-root'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { Optional } from '@/core/types/optional'
import { DocumentRequestStatus } from './value-objects/document-request-status'
import { DocumentRequestType } from './value-objects/document-request-type'

export interface DocumentRequestProps {
	clientId: UniqueEntityId
	requestedBy: UniqueEntityId
	status: DocumentRequestStatus
	requestType: DocumentRequestType
	createdAt: Date
	updatedAt?: Date | null
	documentId?: UniqueEntityId
}

export class DocumentRequest extends AggregateRoot<DocumentRequestProps> {
	get createdAt() {
		return this.props.createdAt
	}

	get updatedAt() {
		return this.props.updatedAt
	}

	get clientId() {
		return this.props.clientId
	}

	get requestedBy() {
		return this.props.requestedBy
	}

	get status() {
		return this.props.status
	}

	get requestType() {
		return this.props.requestType
	}

	get documentId(): UniqueEntityId | undefined {
		return this.props.documentId
	}

	set status(status: DocumentRequestStatus) {
		this.props.status = status
		this.touch()
	}

	set requestedBy(requestedBy: UniqueEntityId) {
		this.props.requestedBy = requestedBy
		this.touch()
	}

	set requestType(requestType: DocumentRequestType) {
		this.props.requestType = requestType
		this.touch()
	}

	set clientId(clientId: UniqueEntityId) {
		this.props.clientId = clientId
		this.touch()
	}

	set documentId(documentId: UniqueEntityId) {
		this.props.documentId = documentId
		this.touch()
	}

	private touch() {
		this.props.updatedAt = new Date()
	}

	static create(
		props: Optional<DocumentRequestProps, 'createdAt'>,
		id?: UniqueEntityId,
	) {
		const documentRequest = new DocumentRequest(
			{
				...props,
				createdAt: props?.createdAt ?? new Date(),
			},
			id,
		)

		return documentRequest
	}
}
