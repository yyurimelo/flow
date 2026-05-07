import { AppError } from "@flow/exceptions";
import type { Request, Response, NextFunction } from "express";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      statusCode: err.statusCode,
      code: err.code,
      details: err.details,
    });
  }

  if (err.name === "ZodError") {
    return res.status(400).json({
      error: "Validation error",
      details: (err as any).errors,
    });
  }

  return res.status(500).json({
    error: "Internal server error",
  });
};