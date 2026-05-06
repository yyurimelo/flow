import { UserException } from "@flow/exceptions";
import { UserRepository } from "@flow/repositories/user.repository";
import {
  createUserSchema,
  getUsersPaginatedSchema,
  updateUserSchema,
  userIdSchema,
  type CreateUserRequest,
  type GetUsersPaginatedRequest,
  type PaginatedUsersResponse,
  type UpdateUserRequest,
  type UserResponse,
} from "@flow/shared";
import type { Role, User } from "@prisma/client";
import bcrypt from "bcrypt";

export class UserService {
  constructor(private readonly userRepository = new UserRepository()) {}

  async signIn(data: CreateUserRequest): Promise<UserResponse> {
    const result = createUserSchema.safeParse(data);

    if (!result.success) {
      throw UserException.ValidationError(result.error.issues);
    }

    const validatedData = result.data;

    const existingUser = await this.userRepository.findByEmailIncludingDeleted(
      validatedData.email
    );

    if (existingUser && !existingUser.deletedAt) {
      throw UserException.EmailInUse();
    }

    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    if (existingUser && existingUser.deletedAt) {
      const restoredUser = await this.userRepository.update(existingUser.id, {
        name: validatedData.name,
        password: hashedPassword,
        deletedAt: null,
        restoredAt: new Date(),
      });

      return this.toUserResponse(restoredUser);
    }

    const user = await this.userRepository.create({
      name: validatedData.name,
      email: validatedData.email,
      password: hashedPassword,
    });

    return this.toUserResponse(user);
  }

  async update(id: string, data: UpdateUserRequest): Promise<UserResponse> {
    const validatedId = this.validateId(id);
    const result = updateUserSchema.safeParse(data);

    if (!result.success) {
      throw UserException.ValidationError(result.error.issues);
    }

    const validatedData = result.data;
    const existingUser = await this.userRepository.findByIdIncludingDeleted(
      validatedId
    );

    if (!existingUser) {
      throw UserException.UserNotFound();
    }

    if (existingUser.deletedAt) {
      throw UserException.UserAlreadyDeleted();
    }

    if (validatedData.email && validatedData.email !== existingUser.email) {
      const userWithEmail =
        await this.userRepository.findByEmailIncludingDeleted(
          validatedData.email
        );

      if (userWithEmail) {
        throw UserException.EmailInUse();
      }
    }

    const updateData: {
      name?: string;
      email?: string;
      password?: string;
      role?: Role;
    } = {};

    if (validatedData.name !== undefined) {
      updateData.name = validatedData.name;
    }

    if (validatedData.email !== undefined) {
      updateData.email = validatedData.email;
    }

    if (validatedData.password !== undefined) {
      const salt = await bcrypt.genSalt(6);
      updateData.password = await bcrypt.hash(validatedData.password, salt);
    }

    if (validatedData.role !== undefined) {
      updateData.role = validatedData.role;
    }

    const user = await this.userRepository.update(validatedId, updateData);

    return this.toUserResponse(user);
  }

  async delete(id: string): Promise<void> {
    const validatedId = this.validateId(id);
    const existingUser = await this.userRepository.findByIdIncludingDeleted(
      validatedId
    );

    if (!existingUser) {
      throw UserException.UserNotFound();
    }

    if (existingUser.deletedAt) {
      throw UserException.UserAlreadyDeleted();
    }

    await this.userRepository.softDelete(validatedId);
  }

  async getAll(): Promise<UserResponse[]> {
    const users = await this.userRepository.findAll();

    return users.map((user) => this.toUserResponse(user));
  }

  async getById(id: string): Promise<UserResponse> {
    const validatedId = this.validateId(id);
    const user = await this.userRepository.findById(validatedId);

    if (!user) {
      throw UserException.UserNotFound();
    }

    return this.toUserResponse(user);
  }

  async getAllPaginated(
    params: GetUsersPaginatedRequest
  ): Promise<PaginatedUsersResponse> {
    const result = getUsersPaginatedSchema.safeParse(params);

    if (!result.success) {
      throw UserException.ValidationError(result.error.issues);
    }

    const { page, limit } = result.data;
    const skip = (page - 1) * limit;

    const [total, users] = await Promise.all([
      this.userRepository.count(),
      this.userRepository.findAllPaginated(skip, limit),
    ]);

    return {
      data: users.map((user) => this.toUserResponse(user)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  private toUserResponse(user: User): UserResponse {
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

  private validateId(id: string) {
    const result = userIdSchema.safeParse(id);

    if (!result.success) {
      throw UserException.ValidationError(result.error.issues);
    }

    return result.data;
  }
}
