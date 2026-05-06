import type { UserResponse } from "../user";

export type AuthResponse = UserResponse & {
  accessToken: string;
}