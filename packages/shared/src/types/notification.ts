import { NotificationType, ActionType } from "../enums";

export interface Notification {
  id: string;
  personId: string;
  title: string;
  body: string;
  type: NotificationType;
  actionType: ActionType | null;
  isRead: boolean;
  linkedDocumentId: string | null;
  linkedMaintenanceRequestId: string | null;
  linkedPaymentId: string | null;
  createdAt: string;
}
