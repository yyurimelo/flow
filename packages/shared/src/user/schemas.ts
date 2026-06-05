import { z } from "zod";
import { USER_ROLE } from "./types.ts";

export const createUserSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Formato de email inválido"),
  password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres"),
});

export const updateUserSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    role: z.enum([USER_ROLE.USER, USER_ROLE.ADMIN]),
  })
  .partial()
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Pelo menos um campo é obrigatório",
  });

export const userIdSchema = z
  .string()
  .regex(/^[a-f\d]{24}$/i, "Formato de ID inválido");

export const getUsersPaginatedSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export type CreateUserRequest = z.infer<typeof createUserSchema>;
export type UpdateUserRequest = z.infer<typeof updateUserSchema>;
export type GetUsersPaginatedRequest = z.input<typeof getUsersPaginatedSchema>;
