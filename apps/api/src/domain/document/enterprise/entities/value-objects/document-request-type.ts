import { ValueObject } from '@/core/entities/value-object'

export type DocumentRequestTypeType =
	| 'PROOF_OF_ADDRESS'
	| 'PROOF_OF_IDENTITY'
	| 'SIGNED_LEASE'
	| 'MOVE_IN_CHECKLIST'

interface DocumentRequestTypeProps {
	value: DocumentRequestTypeType
}

export class DocumentRequestType extends ValueObject<DocumentRequestTypeProps> {
	// biome-ignore lint/style/useNamingConvention: <We want upper case for this constant>
	private static ALLOWED_VALUES: DocumentRequestTypeType[] = [
		'PROOF_OF_ADDRESS',
		'PROOF_OF_IDENTITY',
		'SIGNED_LEASE',
		'MOVE_IN_CHECKLIST',
	]

	private constructor(props: DocumentRequestTypeProps) {
		super(props)
	}

	static create(documentRequestType: string): DocumentRequestType {
		if (
			!DocumentRequestType.ALLOWED_VALUES.includes(
				documentRequestType as DocumentRequestTypeType,
			)
		) {
			throw new Error(
				`Invalid documentRequestType value: ${documentRequestType}`,
			)
		}
		return new DocumentRequestType({
			value: documentRequestType as DocumentRequestTypeType,
		})
	}

	get value(): DocumentRequestTypeType {
		return this.props.value
	}

	static values(): DocumentRequestTypeType[] {
		return DocumentRequestType.ALLOWED_VALUES
	}

	static isValidDocumentRequestType(documentRequestType: string): boolean {
		return DocumentRequestType.ALLOWED_VALUES.includes(
			documentRequestType as DocumentRequestTypeType,
		)
	}
}
