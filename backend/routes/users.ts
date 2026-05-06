import { AppError } from "@flow/exceptions";
import { UserService } from "@flow/services/user.service";
import express from "express";

const router = express.Router();
const userService = new UserService();

router.post("/", async (req, res) => {
  try {
    const response = await userService.create(req.body);
    res.status(201).json(response);
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
});

router.get("/paginated", async (req, res) => {
  try {
    const response = await userService.getAllPaginated(req.query);
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
});

router.get("/", async (_req, res) => {
  try {
    const response = await userService.getAll();
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
});

router.get<{ id: string }>("/:id", async (req, res) => {
  try {
    const response = await userService.getById(req.params.id);
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
});

router.put<{ id: string }>("/:id", async (req, res) => {
  try {
    const response = await userService.update(req.params.id, req.body);
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
});

router.delete<{ id: string }>("/:id", async (req, res) => {
  try {
    await userService.delete(req.params.id);
    res.status(204).send();
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
});

export default router;
