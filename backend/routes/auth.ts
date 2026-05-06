import { AppError } from "@flow/exceptions";
import { AuthService } from "@flow/services/auth.service";
import express from "express";

const router = express.Router()
const authService = new AuthService();

router.post("/", async (req, res) => {
  try {
    const response = await authService.auth(req.body);
    res.status(200).json(response);
  } catch (err) {
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({
        error: err.message,
        statusCode: err.statusCode,
        code: err.code,
        details: err.details,
      });
    }

    if (err instanceof Error && err.name === "ZodError") {
      return res.status(400).json({
        error: "Validation error",
        details: (err as any).errors,
      });
    }

    res.status(500).json({
      error: "Internal server error",
    });
  }
})

export default router

