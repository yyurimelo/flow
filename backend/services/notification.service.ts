import { AuthException, NotificationException, UserException } from "@flow/exceptions";
import { publish } from "@flow/infra/rabbitmq/publisher";
import { NotificationRepository } from "@flow/repositories/notification.repository";
import { UserRepository } from "@flow/repositories/user.repository";
import {
  NOTIFICATION_DESTINATION,
  NOTIFICATION_SCOPE,
  createNotificationSchema,
  getNotificationFiltersSchema,
  getNotificationsSchema,
  notificationIdSchema,
  userIdSchema,
  updateNotificationReadStatusSchema,
  type CreateNotificationRequest,
  type GetNotificationFiltersRequest,
  type GetNotificationsRequest,
  type NotificationDestination,
  type NotificationType,
  type NotificationResponse,
  type PaginatedNotificationsResponse,
  type UpdateNotificationReadStatusRequest,
} from "@flow/shared";
import type {
  Notification as PrismaNotification,
  Prisma,
  Role,
} from "@prisma/client";

export class NotificationService {
  constructor(
    private readonly notificationRepository = new NotificationRepository(),
    private readonly userRepository = new UserRepository()
  ) { }

  async create(
    data: CreateNotificationRequest,
    requesterId: string
  ): Promise<NotificationResponse> {
    const validatedRequesterId = this.validateUserId(requesterId);
    const requester = await this.getRequester(validatedRequesterId);
    const result = createNotificationSchema.safeParse(data);

    if (!result.success) {
      throw NotificationException.ValidationError(result.error.issues);
    }

    const validatedData = result.data;

    if (
      validatedData.destination === NOTIFICATION_DESTINATION.SYSTEM &&
      requester.role !== "ADMIN"
    ) {
      throw NotificationException.SystemNotificationAdminOnly();
    }

    const receiverId =
      validatedData.destination === NOTIFICATION_DESTINATION.USER
        ? validatedData.receiverId!
        : null;
    let receiver: Awaited<ReturnType<UserRepository["findById"]>> = null;

    if (receiverId === validatedRequesterId) {
      throw NotificationException.CannotSendNotificationToSelf();
    }

    if (receiverId !== null) {
      receiver = await this.userRepository.findById(receiverId);

      if (!receiver) {
        throw UserException.UserNotFound();
      }
    }

    const notification = await this.notificationRepository.create({
      senderId: validatedRequesterId,
      receiverId,
      destination: validatedData.destination,
      title: validatedData.title ?? null,
      content: validatedData.content,
      type: validatedData.type,
    });

    const userNamesById = new Map<string, string | null>([
      [requester.id, requester.name ?? null],
    ]);

    if (receiver) {
      userNamesById.set(receiver.id, receiver.name ?? null);
    }

    // Enviar notificação para fila do RabbitMQ
    await publish(
      "notification.created",
      this.mapNotification(notification, userNamesById)
    );

    return this.mapNotification(notification, userNamesById);
  }

  async getAllPaginated(
    params: GetNotificationsRequest,
    filters: GetNotificationFiltersRequest,
    requesterId: string
  ): Promise<PaginatedNotificationsResponse> {
    const validatedRequesterId = this.validateUserId(requesterId);
    const requester = await this.getRequester(validatedRequesterId);

    const paramsResult = getNotificationsSchema.safeParse(params);

    if (!paramsResult.success) {
      throw NotificationException.ValidationError(paramsResult.error.issues);
    }

    const filtersResult = getNotificationFiltersSchema.safeParse(filters);

    if (!filtersResult.success) {
      throw NotificationException.ValidationError(filtersResult.error.issues);
    }

    const { page, limit } = paramsResult.data;
    const { userId, read, type, destination, scope } = filtersResult.data;
    const skip = (page - 1) * limit;
    const targetUserId =
      requester.role === "ADMIN" ? (userId ?? validatedRequesterId) : validatedRequesterId;

    if (
      requester.role !== "ADMIN" &&
      userId !== undefined &&
      userId !== validatedRequesterId
    ) {
      throw AuthException.Forbidden();
    }

    if (requester.role === "ADMIN" && userId !== undefined) {
      const targetUser = await this.userRepository.findById(userId);

      if (!targetUser) {
        throw UserException.UserNotFound();
      }
    }

    const listFilters: {
      read?: boolean;
      type?: PrismaNotification["type"];
      destination?: PrismaNotification["destination"];
      scope: "RECEIVED" | "SENT" | "ALL";
    } = {
      scope,
    };

    if (read !== undefined) {
      listFilters.read = read;
    }

    if (type !== undefined) {
      listFilters.type = type;
    }

    if (destination !== undefined) {
      listFilters.destination = destination;
    }

    const where: Prisma.NotificationWhereInput = {
      ...(this.buildListWhere(targetUserId, listFilters) as object),
      active: { not: false },
    } as Prisma.NotificationWhereInput;
    const unreadWhere = this.buildUnreadWhere(targetUserId);

    const [total, unreadCount, notifications] = await Promise.all([
      this.notificationRepository.count(where),
      this.notificationRepository.countUnread(unreadWhere),
      this.notificationRepository.findManyPaginated(where, skip, limit),
    ]);

    return {
      data: await this.toNotificationResponses(notifications),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        unreadCount,
      },
    };
  }

  async getById(
    id: string,
    requesterId: string
  ): Promise<NotificationResponse> {
    const validatedId = this.validateNotificationId(id);
    const validatedRequesterId = this.validateUserId(requesterId);
    const requester = await this.getRequester(validatedRequesterId);
    const notification = await this.getAccessibleNotification(
      validatedId,
      validatedRequesterId,
      requester.role
    );

    return this.toNotificationResponse(notification);
  }

  async updateReadStatus(
    id: string,
    requesterId: string,
    data: UpdateNotificationReadStatusRequest
  ): Promise<NotificationResponse> {
    const validatedId = this.validateNotificationId(id);
    const validatedRequesterId = this.validateUserId(requesterId);
    const requester = await this.getRequester(validatedRequesterId);
    const result = updateNotificationReadStatusSchema.safeParse(data);

    if (!result.success) {
      throw NotificationException.ValidationError(result.error.issues);
    }

    const notification = await this.getReadableNotification(
      validatedId,
      validatedRequesterId,
      requester.role
    );

    if (notification.destination === NOTIFICATION_DESTINATION.SYSTEM) {
      throw NotificationException.CannotChangeReadStatusOfSystemNotification();
    }

    const updatedNotification = await this.notificationRepository.update(
      notification.id,
      {
        read: result.data.read,
        readAt: result.data.read ? new Date() : null,
      }
    );

    return this.toNotificationResponse(updatedNotification);
  }

  async getManagementPaginated(
    params: GetNotificationsRequest,
    filters: {
      active?: boolean;
      destination?: NotificationDestination;
      type?: NotificationType;
    },
    requesterId: string
  ): Promise<PaginatedNotificationsResponse> {
    const validatedRequesterId = this.validateUserId(requesterId);
    const requester = await this.getRequester(validatedRequesterId);

    const paramsResult = getNotificationsSchema.safeParse(params);

    if (!paramsResult.success) {
      throw NotificationException.ValidationError(paramsResult.error.issues);
    }

    const { page, limit } = paramsResult.data;
    const skip = (page - 1) * limit;

    const where: Prisma.NotificationWhereInput = {};

    if (requester.role !== "ADMIN") {
      where.senderId = validatedRequesterId;
    }

    // TODO: remove cast after `npm -w backend exec prisma generate`
    const whereAny = where as any;
    if (filters.active !== undefined) {
      whereAny.active = filters.active;
    }

    if (filters.destination !== undefined) {
      where.destination = filters.destination;
    }

    if (filters.type !== undefined) {
      where.type = filters.type;
    }

    const [total, notifications] = await Promise.all([
      this.notificationRepository.count(where),
      this.notificationRepository.findManyPaginated(where, skip, limit),
    ]);

    return {
      data: await this.toNotificationResponses(notifications),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        unreadCount: 0,
      },
    };
  }

  async setActive(id: string, requesterId: string, active: boolean): Promise<NotificationResponse> {
    const validatedId = this.validateNotificationId(id);
    const validatedRequesterId = this.validateUserId(requesterId);
    const requester = await this.getRequester(validatedRequesterId);
    const notification = await this.notificationRepository.findById(validatedId);

    if (!notification) {
      throw NotificationException.NotificationNotFound();
    }

    const canManage =
      requester.role === "ADMIN" || notification.senderId === validatedRequesterId;

    if (!canManage) {
      throw AuthException.Forbidden();
    }

    const updated = await this.notificationRepository.setActive(validatedId, active);

    return this.toNotificationResponse(updated);
  }

  async delete(id: string, requesterId: string): Promise<void> {
    const validatedId = this.validateNotificationId(id);
    const validatedRequesterId = this.validateUserId(requesterId);
    const requester = await this.getRequester(validatedRequesterId);
    const notification = await this.getAccessibleNotification(
      validatedId,
      validatedRequesterId,
      requester.role
    );

    await this.notificationRepository.delete(notification.id);
  }

  private buildListWhere(
    targetUserId: string | null,
    filters: {
      read?: boolean;
      type?: PrismaNotification["type"];
      destination?: PrismaNotification["destination"];
      scope: "RECEIVED" | "SENT" | "ALL";
    }
  ): Prisma.NotificationWhereInput {
    const baseFilters: Prisma.NotificationWhereInput = {};

    if (filters.read !== undefined) {
      baseFilters.read = filters.read;
    }

    if (filters.type !== undefined) {
      baseFilters.type = filters.type;
    }

    if (filters.destination !== undefined) {
      baseFilters.destination = filters.destination;
    }

    // System notifications are broadcasts — no user ownership filter applies
    if (filters.destination === NOTIFICATION_DESTINATION.SYSTEM) {
      return baseFilters;
    }

    if (targetUserId === null) {
      if (filters.scope === NOTIFICATION_SCOPE.RECEIVED) {
        return {
          ...baseFilters,
          receiverId: { not: null },
        };
      }

      if (filters.scope === NOTIFICATION_SCOPE.SENT) {
        return {
          ...baseFilters,
          senderId: { not: null },
        };
      }

      return baseFilters;
    }

    if (filters.scope === NOTIFICATION_SCOPE.SENT) {
      return {
        ...baseFilters,
        senderId: targetUserId,
      };
    }

    // RECEIVED and ALL: USER notifications addressed to me OR SYSTEM broadcasts
    return {
      ...baseFilters,
      OR: [
        { receiverId: targetUserId },
        { destination: NOTIFICATION_DESTINATION.SYSTEM },
      ],
    } as Prisma.NotificationWhereInput;
  }

  private buildUnreadWhere(targetUserId: string | null): Prisma.NotificationWhereInput {
    if (targetUserId === null) {
      return {
        read: false,
        receiverId: { not: null },
      };
    }

    return {
      read: false,
      OR: [
        { receiverId: targetUserId },
        { destination: NOTIFICATION_DESTINATION.SYSTEM },
      ],
    } as Prisma.NotificationWhereInput;
  }

  private async getRequester(requesterId: string) {
    const requester = await this.userRepository.findById(requesterId);

    if (!requester) {
      throw AuthException.Unauthorized();
    }

    return requester;
  }

  private async getAccessibleNotification(
    notificationId: string,
    requesterId: string,
    requesterRole: Role
  ) {
    const notification = await this.notificationRepository.findById(notificationId);

    if (!notification) {
      throw NotificationException.NotificationNotFound();
    }

    const canAccess =
      requesterRole === "ADMIN" ||
      notification.senderId === requesterId ||
      notification.receiverId === requesterId;

    if (!canAccess) {
      throw AuthException.Forbidden();
    }

    return notification;
  }

  private async getReadableNotification(
    notificationId: string,
    requesterId: string,
    requesterRole: Role
  ) {
    const notification = await this.getAccessibleNotification(
      notificationId,
      requesterId,
      requesterRole
    );

    if (requesterRole === "ADMIN") {
      return notification;
    }

    if (notification.receiverId !== requesterId) {
      throw AuthException.Forbidden();
    }

    return notification;
  }

  private async toNotificationResponse(
    notification: PrismaNotification
  ): Promise<NotificationResponse> {
    const userIds = [notification.senderId, notification.receiverId].filter(
      (value): value is string => typeof value === "string"
    );
    const userNamesById = await this.getUserNamesById(userIds);

    return this.mapNotification(notification, userNamesById);
  }

  private async toNotificationResponses(
    notifications: PrismaNotification[]
  ): Promise<NotificationResponse[]> {
    if (notifications.length === 0) {
      return [];
    }

    const userIds = Array.from(
      new Set(
        notifications.flatMap((notification) =>
          [notification.senderId, notification.receiverId].filter(
            (value): value is string => typeof value === "string"
          )
        )
      )
    );

    const userNamesById = await this.getUserNamesById(userIds);

    return notifications.map((notification) =>
      this.mapNotification(notification, userNamesById)
    );
  }

  private async getUserNamesById(ids: string[]) {
    if (ids.length === 0) {
      return new Map<string, string | null>();
    }

    const users = await this.userRepository.findManyByIds(ids);

    return new Map(users.map((user) => [user.id, user.name ?? null] as const));
  }

  private mapNotification(
    notification: PrismaNotification,
    userNamesById: Map<string, string | null>
  ): NotificationResponse {
    return {
      id: notification.id,
      senderId: notification.senderId,
      senderName:
        notification.senderId !== null
          ? (userNamesById.get(notification.senderId) ?? null)
          : null,
      receiverId: notification.receiverId,
      receiverName:
        notification.receiverId !== null
          ? (userNamesById.get(notification.receiverId) ?? null)
          : null,
      destination: notification.destination,
      title: notification.title,
      content: notification.content,
      type: notification.type,
      read: notification.read,
      readAt: notification.readAt?.toISOString() ?? null,
      active: notification.active !== false,
      createdAt: notification.createdAt.toISOString(),
      updatedAt: notification.updatedAt?.toISOString() ?? null,
    };
  }

  private validateUserId(id: string) {
    const result = userIdSchema.safeParse(id);

    if (!result.success) {
      throw NotificationException.ValidationError(result.error.issues);
    }

    return result.data;
  }

  private validateNotificationId(id: string) {
    const result = notificationIdSchema.safeParse(id);

    if (!result.success) {
      throw NotificationException.ValidationError(result.error.issues);
    }

    return result.data;
  }
}
