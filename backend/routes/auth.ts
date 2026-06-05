import { AuthService } from "@flow/services/auth.service";
import authMiddleware from "@flow/middleware/auth";
import express from "express";

const router = express.Router()
const authService = new AuthService();

router.post("/", async (req, res, next) => {
  try {
    const response = await authService.signIn(req.body);
    return res.status(200).json(response);
  } catch (err) {
    return next(err);
  }
})

router.get("/me", authMiddleware, async (req: any, res, next) => {
  try {
    const response = await authService.getMe(req.userId);
    return res.status(200).json(response);
  } catch (err) {
    return next(err);
  }
})

export default router

