export const USER_ROLE = {
  USER: "USER",
  ADMIN: "ADMIN",
} as const;

export type UserRole = (typeof USER_ROLE)[keyof typeof USER_ROLE];

export type User = {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
  createdAt: string;
  createdBy: string | null;
  updatedAt: string | null;
};

export type UserResponse = User;
