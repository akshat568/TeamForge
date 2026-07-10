import express from "express";
import {
  register,
  login,
  getCurrentUser,
  forgotPasswordRateLimiter,
  forgotPassword,
  resetPassword,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, getCurrentUser);
router.post("/forgot-password", forgotPasswordRateLimiter, forgotPassword);
router.post("/reset-password/:token", resetPassword);

export default router;
