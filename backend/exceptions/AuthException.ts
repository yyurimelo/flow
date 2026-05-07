import { AppError } from "./AppError";

export class AuthException {
  static InvalidCredentials = () =>
    new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");

  static EmailPendingVerification = () =>
    new AppError(
      "Email pending verification. Check your inbox or request a new confirmation email.",
      409,
      "EMAIL_PENDING_VERIFICATION"
    );

  static FailedToSendEmail = () =>
    new AppError(
      "Failed to send confirmation email. Please try again.",
      500,
      "FAILED_TO_SEND_EMAIL"
    );

  static TokenInvalid = () =>
    new AppError("Invalid or expired token", 401, "TOKEN_INVALID");

  static Unauthorized = () =>
    new AppError("Unauthorized access", 401, "UNAUTHORIZED");

  static Forbidden = () =>
    new AppError(
      "You do not have permission to access this resource",
      403,
      "FORBIDDEN"
    );

}
