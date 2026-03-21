export interface Signature {
  id: string;
  documentId: string;
  signedBy: string;
  signatureImageKey: string;
  ipAddress: string | null;
  userAgent: string | null;
  signedAt: string;
}
