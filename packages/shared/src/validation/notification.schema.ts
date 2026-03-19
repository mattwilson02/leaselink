import { z } from "zod";
import { NotificationType, ActionType } from "../enums";

export const createNotificationSchema = z.object({
  personId: z.string().uuid("Invalid person ID"),
  title: z.string().min(1, "Title is required"),
  body: z.string().min(1, "Body is required"),
  type: z.nativeEnum(NotificationType),
  actionType: z.nativeEnum(ActionType).optional(),
  linkedDocumentId: z.string().uuid().optional(),
  linkedMaintenanceRequestId: z.string().uuid().optional(),
  linkedPaymentId: z.string().uuid().optional(),
});

export const updateNotificationSchema = z.object({
  isRead: z.boolean().optional(),
});

export type CreateNotificationInput = z.infer<
  typeof createNotificationSchema
>;
export type UpdateNotificationInput = z.infer<
  typeof updateNotificationSchema
>;
