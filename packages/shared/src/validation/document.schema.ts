import { z } from "zod";
import { DocumentFolder, DocumentRequestType } from "../enums";

export const uploadDocumentSchema = z.object({
  name: z.string().min(1, "Document name is required"),
  folder: z.nativeEnum(DocumentFolder),
  contentType: z.string().min(1, "Content type is required"),
  size: z.number().int().positive("File size must be greater than 0"),
  tenantId: z.string().uuid("Invalid tenant ID"),
  propertyId: z.string().uuid("Invalid property ID").optional(),
});

export const createDocumentRequestSchema = z.object({
  tenantId: z.string().uuid("Invalid tenant ID"),
  requestType: z.nativeEnum(DocumentRequestType),
});

export const documentFilterSchema = z.object({
  folder: z.nativeEnum(DocumentFolder).optional(),
  tenantId: z.string().uuid().optional(),
  propertyId: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(200).default(20),
});

export type UploadDocumentInput = z.infer<typeof uploadDocumentSchema>;
export type CreateDocumentRequestInput = z.infer<
  typeof createDocumentRequestSchema
>;
export type DocumentFilterInput = z.infer<typeof documentFilterSchema>;
