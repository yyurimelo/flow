import { AppError } from "./AppError";

export class NotificationException {
  static NotificationNotFound = () =>
    new AppError("Notification not found", 404, "NOTIFICATION_NOT_FOUND");

  static CannotSendNotificationToSelf = () =>
    new AppError(
      "You cannot send a notification to yourself",
      400,
      "CANNOT_SEND_NOTIFICATION_TO_SELF"
    );

  static SystemNotificationAdminOnly = () =>
    new AppError(
      "Only admins can create system notifications",
      403,
      "SYSTEM_NOTIFICATION_ADMIN_ONLY"
    );

  static ValidationError = (details: any) =>
    new AppError("Validation error", 400, "VALIDATION_ERROR", details);
}
