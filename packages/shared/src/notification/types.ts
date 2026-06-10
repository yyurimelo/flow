export const NOTIFICATION_TYPE = {
  INFO: "INFO",
  SUCCESS: "SUCCESS",
  WARNING: "WARNING",
  ERROR: "ERROR",
} as const;

export const NOTIFICATION_DESTINATION = {
  USER: "USER",
  SYSTEM: "SYSTEM",
} as const;

export const NOTIFICATION_SCOPE = {
  RECEIVED: "RECEIVED",
  SENT: "SENT",
  ALL: "ALL",
} as const;

export type NotificationType =
  (typeof NOTIFICATION_TYPE)[keyof typeof NOTIFICATION_TYPE];

export type NotificationDestination =
  (typeof NOTIFICATION_DESTINATION)[keyof typeof NOTIFICATION_DESTINATION];

export type NotificationScope =
  (typeof NOTIFICATION_SCOPE)[keyof typeof NOTIFICATION_SCOPE];

export type Notification = {
  id: string;
  senderId: string | null;
  senderName: string | null;
  receiverId: string | null;
  receiverName: string | null;
  destination: NotificationDestination;
  title: string | null;
  content: string;
  type: NotificationType;
  read: boolean;
  readAt: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string | null;
};

export type NotificationResponse = Notification;

export type PaginatedNotificationsResponse = {
  data: NotificationResponse[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    unreadCount: number;
  };
};
