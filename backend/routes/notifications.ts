import authMiddleware from "@flow/middleware/auth";
import { NotificationService } from "@flow/services/notification.service";
import express from "express";

const router = express.Router();
const notificationService = new NotificationService();

router.post("/", authMiddleware, async (req, res, next) => {
  try {
    const response = await notificationService.create(
      req.body,
      (req as any).userId
    );

    return res.status(201).json(response);
  } catch (err) {
    return next(err);
  }
});

router.post("/manage/paginated", authMiddleware, async (req, res, next) => {
  try {
    const response = await notificationService.getManagementPaginated(
      req.query,
      req.body,
      (req as any).userId
    );

    return res.status(200).json(response);
  } catch (err) {
    return next(err);
  }
});

router.patch<{ id: string }>("/:id/active", authMiddleware, async (req, res, next) => {
  try {
    const { active } = req.body;

    if (typeof active !== "boolean") {
      return res.status(400).json({ message: "active must be a boolean" });
    }

    const response = await notificationService.setActive(
      req.params.id,
      (req as any).userId,
      active
    );

    return res.status(200).json(response);
  } catch (err) {
    return next(err);
  }
});

router.post("/paginated", authMiddleware, async (req, res, next) => {
  try {
    const response = await notificationService.getAllPaginated(
      req.query,
      req.body,
      (req as any).userId
    );

    return res.status(200).json(response);
  } catch (err) {
    return next(err);
  }
});

router.get<{ id: string }>("/:id", authMiddleware, async (req, res, next) => {
  try {
    const response = await notificationService.getById(
      req.params.id,
      (req as any).userId
    );

    return res.status(200).json(response);
  } catch (err) {
    return next(err);
  }
});

router.patch<{ id: string }>("/:id/read-status", authMiddleware, async (req, res, next) => {
  try {
    const response = await notificationService.updateReadStatus(
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
    await notificationService.delete(req.params.id, (req as any).userId);

    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
});

export default router;
