import { PropertyType, PropertyStatus } from "../enums";

export interface CreatePropertyDto {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  propertyType: PropertyType;
  bedrooms: number;
  bathrooms: number;
  sqft?: number;
  rentAmount: number;
  description?: string;
}

export interface UpdatePropertyDto {
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  propertyType?: PropertyType;
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number | null;
  rentAmount?: number;
  description?: string | null;
  status?: PropertyStatus;
}

export interface PropertyFilterDto {
  status?: PropertyStatus;
  search?: string;
  page?: number;
  pageSize?: number;
}
