export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public details?: unknown;

  constructor(
    message: string,
    statusCode: number = 500,
    code?: string,
    details?: unknown
  ) {
    super(message);

    this.statusCode = statusCode;
    this.code = code ?? "";

    if (details !== undefined) {
      this.details = details;
    }

    Object.setPrototypeOf(this, AppError.prototype);
  }
}
