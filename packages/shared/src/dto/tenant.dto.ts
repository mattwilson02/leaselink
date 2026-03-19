import { TenantStatus, OnboardingStatus } from "../enums";

export interface CreateTenantDto {
  name: string;
  email: string;
  phoneNumber: string;
}

export interface UpdateTenantStatusDto {
  status: TenantStatus;
}

export interface SetNotificationPreferencesDto {
  receivesEmailNotifications?: boolean;
  receivesPushNotifications?: boolean;
  receivesNotificationsForMaintenance?: boolean;
  receivesNotificationsForDocuments?: boolean;
}

export interface TenantFilterDto {
  status?: TenantStatus;
  onboardingStatus?: OnboardingStatus;
  search?: string;
  page?: number;
  pageSize?: number;
}
