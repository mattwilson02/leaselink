import { ValueObject } from '@/core/entities/value-object'

export type DocumentFolderType =
	| 'IDENTIFICATION'
	| 'LEASE_AGREEMENTS'
	| 'SIGNED_DOCUMENTS'
	| 'INSPECTION_REPORTS'
	| 'INSURANCE'
	| 'OTHER'

interface DocumentFolderProps {
	value: DocumentFolderType
}

export class DocumentFolder extends ValueObject<DocumentFolderProps> {
	// biome-ignore lint/style/useNamingConvention: <We want upper case for this constant>
	private static ALLOWED_VALUES: DocumentFolderType[] = [
		'IDENTIFICATION',
		'LEASE_AGREEMENTS',
		'SIGNED_DOCUMENTS',
		'INSPECTION_REPORTS',
		'INSURANCE',
		'OTHER',
	]

	// biome-ignore lint/style/useNamingConvention: <explanation>
	private static readonly DEFAULT_VALUE: DocumentFolderType = 'OTHER'

	private constructor(props: DocumentFolderProps) {
		super(props)
	}

	static create(documentFolder?: string): DocumentFolder {
		if (
			!DocumentFolder.ALLOWED_VALUES.includes(
				documentFolder as DocumentFolderType,
			)
		) {
			return new DocumentFolder({
				value: DocumentFolder.DEFAULT_VALUE,
			})
		}
		return new DocumentFolder({ value: documentFolder as DocumentFolderType })
	}

	get value(): DocumentFolderType {
		return this.props.value
	}

	static values(): DocumentFolderType[] {
		return DocumentFolder.ALLOWED_VALUES
	}

	static isValidDocumentFolder(documentFolder: string): boolean {
		return DocumentFolder.ALLOWED_VALUES.includes(
			documentFolder as DocumentFolderType,
		)
	}
}
