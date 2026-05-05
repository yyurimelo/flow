import { AppError } from "./AppError";

export class UserException {
  static EmailInUse = () =>
    new AppError("Email already in use", 409, "EMAIL_IN_USE");

  static UserNotFound = () =>
    new AppError("User not found", 404, "USER_NOT_FOUND");

  static InvalidCredentials = () =>
    new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");

  static ValidationError = (details: any) =>
    new AppError("Validation error", 400, "VALIDATION_ERROR");
}
