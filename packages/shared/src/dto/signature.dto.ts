import { z } from "zod";

export const createSignatureSchema = z.object({
  documentId: z.string().uuid("Invalid document ID"),
});

export const signatureResponseSchema = z.object({
  id: z.string().uuid(),
  documentId: z.string().uuid(),
  signedBy: z.string().uuid(),
  signatureImageKey: z.string(),
  ipAddress: z.string().nullable(),
  userAgent: z.string().nullable(),
  signedAt: z.string(),
});

export type CreateSignatureInput = z.infer<typeof createSignatureSchema>;
export type SignatureResponseOutput = z.infer<typeof signatureResponseSchema>;

// Plain DTO interfaces (for use without Zod parsing)
export interface CreateSignatureDto {
  documentId: string;
  signatureImageKey: string;
}

export interface SignatureResponseDto {
  id: string;
  documentId: string;
  signedBy: string;
  signatureImageKey: string;
  ipAddress: string | null;
  userAgent: string | null;
  signedAt: string;
}
