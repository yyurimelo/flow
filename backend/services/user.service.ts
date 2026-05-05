import { UserException } from "@flow/exceptions";
import { prisma } from "@flow/prisma";
import { createUserSchema, type CreateUserRequest, type UserResponse } from "@flow/shared";
import bcrypt from "bcrypt";

export class UserService {
  async create(data: CreateUserRequest): Promise<UserResponse> {
    const result = createUserSchema.safeParse(data);

    if (!result.success) {
      throw UserException.ValidationError(result.error.issues);
    }

    const validatedData = result.data;

    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      throw UserException.EmailInUse();
    }

    const salt = await bcrypt.genSalt(6);
    const hashedPassword = await bcrypt.hash(validatedData.password, salt);

    const user = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        password: hashedPassword,
      },
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt?.toISOString() ?? null,
      createdBy: user.createdBy,
    };
  }
}
