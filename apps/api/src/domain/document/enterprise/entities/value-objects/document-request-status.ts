import { ValueObject } from '@/core/entities/value-object'

export type DocumentRequestStatusType = 'PENDING' | 'UPLOADED' | 'CANCELED'

interface DocumentRequestStatusProps {
	value: DocumentRequestStatusType
}

export class DocumentRequestStatus extends ValueObject<DocumentRequestStatusProps> {
	// biome-ignore lint/style/useNamingConvention: <We want upper case for this constant>
	private static ALLOWED_VALUES: DocumentRequestStatusType[] = [
		'PENDING',
		'UPLOADED',
		'CANCELED',
	]

	// biome-ignore lint/style/useNamingConvention: <explanation>
	private static readonly DEFAULT_VALUE: DocumentRequestStatusType = 'PENDING'

	private constructor(props: DocumentRequestStatusProps) {
		super(props)
	}

	static create(documentRequestStatus?: string): DocumentRequestStatus {
		if (
			!DocumentRequestStatus.ALLOWED_VALUES.includes(
				documentRequestStatus as DocumentRequestStatusType,
			)
		) {
			return new DocumentRequestStatus({
				value: DocumentRequestStatus.DEFAULT_VALUE,
			})
		}
		return new DocumentRequestStatus({
			value: documentRequestStatus as DocumentRequestStatusType,
		})
	}

	get value(): DocumentRequestStatusType {
		return this.props.value
	}

	static values(): DocumentRequestStatusType[] {
		return DocumentRequestStatus.ALLOWED_VALUES
	}

	static isValidDocumentRequestStatus(documentRequestStatus: string): boolean {
		return DocumentRequestStatus.ALLOWED_VALUES.includes(
			documentRequestStatus as DocumentRequestStatusType,
		)
	}
}
