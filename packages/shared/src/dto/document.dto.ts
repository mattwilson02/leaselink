import { DocumentFolder, DocumentRequestType } from "../enums";

export interface UploadDocumentDto {
  name: string;
  folder: DocumentFolder;
  contentType: string;
  size: number;
  tenantId: string;
  propertyId?: string;
}

export interface CreateDocumentRequestDto {
  tenantId: string;
  requestType: DocumentRequestType;
}

export interface DocumentFilterDto {
  folder?: DocumentFolder;
  tenantId?: string;
  propertyId?: string;
  page?: number;
  pageSize?: number;
}
