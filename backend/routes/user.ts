import express from "express";
import { UserService } from "../services/user.service";
import { AppError } from "@flow/exceptions";

const router = express.Router();
const userService = new UserService();

router.post("/", async (req, res) => {
  try {
    const user = await userService.create(req.body);
    res.status(201).json(user);
  } catch (err) {
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({
        error: err.message,
        code: err.code,
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
});

export default router;
