import { AggregateRoot } from '@/core/entities/aggregate-root'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { Optional } from '@/core/types/optional'
import { DocumentFolder } from './value-objects/document-folders'

export interface DocumentProps {
	clientId: UniqueEntityId
	contentKey: UniqueEntityId
	version: number
	name: string
	blobName: string
	fileSize: number
	thumbnailBlobName: string | null
	folder: DocumentFolder
	uploadedBy: UniqueEntityId
	createdAt: Date
	updatedAt?: Date | null
	viewedAt?: Date | null
}

export class Document extends AggregateRoot<DocumentProps> {
	get createdAt() {
		return this.props.createdAt
	}

	get contentKey() {
		return this.props.contentKey
	}

	get uploadedBy() {
		return this.props.uploadedBy
	}

	get updatedAt() {
		return this.props.updatedAt
	}

	get clientId() {
		return this.props.clientId
	}

	get version() {
		return this.props.version
	}

	get name() {
		return this.props.name
	}

	get blobName() {
		return this.props.blobName
	}

	get fileSize() {
		return this.props.fileSize
	}

	get folder() {
		return this.props.folder
	}

	get thumbnailBlobName(): string | null {
		return this.props.thumbnailBlobName
	}

	get viewedAt(): Date | null {
		return this.props.viewedAt || null
	}

	set viewedAt(viewedAt: Date | null) {
		this.props.viewedAt = viewedAt
		this.touch()
	}

	set name(name: string) {
		this.props.name = name
		this.touch()
	}

	set contentKey(contentKey: UniqueEntityId) {
		this.props.contentKey = contentKey
		this.touch()
	}

	set uploadedBy(uploadedBy: UniqueEntityId) {
		this.props.uploadedBy = uploadedBy
		this.touch()
	}

	set blobName(blobName: string) {
		this.props.blobName = blobName
		this.touch()
	}

	set thumbnailBlobName(thumbnailBlobName: string) {
		this.props.thumbnailBlobName = thumbnailBlobName
		this.touch()
	}

	set version(version: number) {
		this.props.version = version
		this.touch()
	}

	set clientId(clientId: UniqueEntityId) {
		this.props.clientId = clientId
		this.touch()
	}

	set fileSize(fileSize: number) {
		this.props.fileSize = fileSize
		this.touch()
	}

	set folder(folder: DocumentFolder) {
		this.props.folder = folder
		this.touch()
	}

	private touch() {
		this.props.updatedAt = new Date()
	}
	static create(
		props: Optional<DocumentProps, 'createdAt'>,
		id?: UniqueEntityId,
	) {
		const document = new Document(
			{
				...props,
				createdAt: props?.createdAt ?? new Date(),
				folder: props?.folder ?? DocumentFolder.create(),
			},
			id,
		)

		return document
	}
}
