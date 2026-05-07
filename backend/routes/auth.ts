import { AuthService } from "@flow/services/auth.service";
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

export default router

