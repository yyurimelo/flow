import { z } from "zod";
import { USER_ROLE } from "./types.ts";

export const createUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const updateUserSchema = createUserSchema
  .extend({
    role: z.enum([USER_ROLE.USER, USER_ROLE.ADMIN]),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });

export const userIdSchema = z
  .string()
  .regex(/^[a-f\d]{24}$/i, "Invalid user id format");

export const getUsersPaginatedSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export type CreateUserRequest = z.infer<typeof createUserSchema>;
export type UpdateUserRequest = z.infer<typeof updateUserSchema>;
export type GetUsersPaginatedRequest = z.input<typeof getUsersPaginatedSchema>;
