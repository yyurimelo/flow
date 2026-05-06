import type { User } from "@prisma/client";
import { authSchema, type AuthRequest, type AuthResponse } from "@flow/shared";
import { AuthException, UserException } from "@flow/exceptions";
import { UserRepository } from "@flow/repositories/user.repository";
import { TokenService } from "@flow/services/token.service";
import bcrypt from "bcrypt";

export class AuthService {
  constructor(
    private readonly userRepository = new UserRepository(),
    private readonly tokenService = new TokenService()
  ) {}

  async auth(data: AuthRequest): Promise<AuthResponse> {
    const result = authSchema.safeParse(data);

    if (!result.success) {
      throw UserException.ValidationError(result.error.issues);
    }

    const validatedData = result.data;

    const existingUser = await this.userRepository.findByEmail(
      validatedData.email
    );

    if (!existingUser) {
      throw UserException.UserNotFound();
    }

    const isPasswordValid = await bcrypt.compare(
      validatedData.password,
      existingUser.password
    );

    if (!isPasswordValid) {
      throw AuthException.InvalidCredentials();
    }

    const token = this.tokenService.generateAccessToken(existingUser.id);

    return this.toAuthResponse(existingUser, token);
  }

  private toAuthResponse(user: User, token: string): AuthResponse {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt?.toISOString() ?? null,
      createdBy: user.createdBy,
      accessToken: token,
    };
  }
}
