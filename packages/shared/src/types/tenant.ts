import { TenantStatus, OnboardingStatus } from "../enums";

export interface Tenant {
  id: string;
  email: string;
  name: string;
  phoneNumber: string;
  status: TenantStatus;
  onboardingStatus: OnboardingStatus;
  profilePhoto: string | null;
  pushToken: string | null;
  deviceId: string | null;
  onboardingToken: string | null;
  receivesEmailNotifications: boolean;
  receivesPushNotifications: boolean;
  receivesNotificationsForMaintenance: boolean;
  receivesNotificationsForDocuments: boolean;
  createdAt: string;
  updatedAt: string | null;
}
