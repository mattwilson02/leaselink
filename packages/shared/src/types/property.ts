import { PropertyType, PropertyStatus } from "../enums";

export interface Property {
  id: string;
  managerId: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  propertyType: PropertyType;
  bedrooms: number;
  bathrooms: number;
  sqft: number | null;
  rentAmount: number;
  status: PropertyStatus;
  description: string | null;
  photos: string[];
  createdAt: string;
  updatedAt: string | null;
}
