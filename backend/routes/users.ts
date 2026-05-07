import { UserService } from "@flow/services/user.service";
import express from "express";
import authMiddleware from "@flow/middleware/auth"

const router = express.Router();
const userService = new UserService();

router.post("/", async (req, res, next) => {
  try {
    const response = await userService.create(req.body);

    return res.status(201).json(response);
  } catch (err) {
    return next(err);
  }
});

router.get("/paginated", authMiddleware, async (req, res, next) => {
  try {
    const response = await userService.getAllPaginated(req.query, (req as any).userId);

    return res.status(200).json(response);
  } catch (err) {
    return next(err);
  }
});

router.get("/", authMiddleware, async (_, res, next) => {
  try {
    const response = await userService.getAll();

    return res.status(200).json(response);
  } catch (err) {
    return next(err);
  }
});

router.get<{ id: string }>("/:id", authMiddleware, async (req, res, next) => {
  try {
    const response = await userService.getById(req.params.id);

    return res.status(200).json(response);
  } catch (err) {
    return next(err);
  }
});

router.put<{ id: string }>("/:id", authMiddleware, async (req, res, next) => {
  try {
    const response = await userService.update(
      req.params.id,
      (req as any).userId,
      req.body
    );

    return res.status(200).json(response);
  } catch (err) {
    return next(err);
  }
});

router.delete<{ id: string }>("/:id", authMiddleware, async (req, res, next) => {
  try {
    await userService.delete(req.params.id, (req as any).userId);

    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
});

export default router;
