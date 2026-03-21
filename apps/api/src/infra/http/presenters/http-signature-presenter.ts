import type { Signature } from '@/domain/signature/enterprise/entities/signature'

export class HttpSignaturePresenter {
	static toHTTP(signature: Signature) {
		return {
			id: signature.id.toString(),
			documentId: signature.documentId.toString(),
			signedBy: signature.signedBy.toString(),
			signatureImageKey: signature.signatureImageKey,
			ipAddress: signature.ipAddress,
			userAgent: signature.userAgent,
			signedAt: signature.signedAt.toISOString(),
		}
	}
}
