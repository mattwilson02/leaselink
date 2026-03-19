import { NotificationType, ActionType } from "../enums";

export interface CreateNotificationDto {
  personId: string;
  title: string;
  body: string;
  type: NotificationType;
  actionType?: ActionType;
  linkedDocumentId?: string;
  linkedMaintenanceRequestId?: string;
  linkedPaymentId?: string;
}

export interface UpdateNotificationDto {
  isRead?: boolean;
}
