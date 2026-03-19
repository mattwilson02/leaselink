import { DocumentFolder } from "../enums";

export interface Document {
  id: string;
  tenantId: string;
  propertyId: string | null;
  name: string;
  folder: DocumentFolder;
  blobStorageKey: string;
  contentType: string;
  size: number;
  viewedAt: string | null;
  createdAt: string;
  updatedAt: string | null;
}
