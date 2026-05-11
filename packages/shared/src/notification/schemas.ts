import { z } from "zod";
import { userIdSchema } from "../user/schemas.ts";
import {
  NOTIFICATION_DESTINATION,
  NOTIFICATION_SCOPE,
  NOTIFICATION_TYPE,
} from "./types.ts";

const notificationTypeSchema = z.enum([
  NOTIFICATION_TYPE.INFO,
  NOTIFICATION_TYPE.SUCCESS,
  NOTIFICATION_TYPE.WARNING,
  NOTIFICATION_TYPE.ERROR,
]);

const notificationDestinationSchema = z.enum([
  NOTIFICATION_DESTINATION.USER,
  NOTIFICATION_DESTINATION.SYSTEM,
]);

const notificationScopeSchema = z.enum([
  NOTIFICATION_SCOPE.RECEIVED,
  NOTIFICATION_SCOPE.SENT,
  NOTIFICATION_SCOPE.ALL,
]);

const booleanQuerySchema = z.preprocess((value) => {
  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return value;
}, z.boolean());

export const notificationIdSchema = userIdSchema;

export const createNotificationSchema = z
  .object({
    receiverId: z.union([userIdSchema, z.null()]).optional(),
    destination: notificationDestinationSchema.default(
      NOTIFICATION_DESTINATION.USER
    ),
    title: z.string().trim().min(1, "Title is required").max(120).optional(),
    content: z
      .string()
      .trim()
      .min(1, "Content is required")
      .max(1000, "Content must be at most 1000 characters"),
    type: notificationTypeSchema.default(NOTIFICATION_TYPE.INFO),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (
      data.destination === NOTIFICATION_DESTINATION.USER &&
      (data.receiverId === undefined || data.receiverId === null)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["receiverId"],
        message: "receiverId is required when destination is USER",
      });
    }

    if (
      data.destination === NOTIFICATION_DESTINATION.SYSTEM &&
      data.receiverId !== undefined &&
      data.receiverId !== null
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["receiverId"],
        message: "receiverId must be null when destination is SYSTEM",
      });
    }
  });

export const getNotificationsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export const getNotificationFiltersSchema = z.object({
  userId: userIdSchema.optional(),
  read: booleanQuerySchema.optional(),
  type: notificationTypeSchema.optional(),
  destination: notificationDestinationSchema.optional(),
  scope: notificationScopeSchema.default(NOTIFICATION_SCOPE.ALL),
});

export const updateNotificationReadStatusSchema = z.object({
  read: z.boolean(),
});

export type CreateNotificationRequest = z.infer<typeof createNotificationSchema>;
export type GetNotificationsRequest = z.input<typeof getNotificationsSchema>;
export type GetNotificationFiltersRequest = z.input<
  typeof getNotificationFiltersSchema
>;
export type UpdateNotificationReadStatusRequest = z.infer<
  typeof updateNotificationReadStatusSchema
>;
