import { USER_ROLE } from "./enums";

export interface User {
  id: string;
  name: string;
  email: string;
  role: (typeof USER_ROLE)[keyof typeof USER_ROLE]
  createdAt?: string;
  createdBy?: string;
  updatedAt?: string;
}