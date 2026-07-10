import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getNotifications,
  getUnreadNotifications,
  getUnreadCount,
  markRead,
  markAllRead,
  deleteNotification,
  deleteReadNotifications
} from "../controllers/notificationController.js";

const router = express.Router();

// Enforce JWT protect globally
router.use(protect);

router.get("/", getNotifications);
router.get("/unread", getUnreadNotifications);
router.get("/count", getUnreadCount);
router.patch("/read-all", markAllRead);
router.patch("/:id/read", markRead);
router.delete("/read", deleteReadNotifications);
router.delete("/:id", deleteNotification);

export default router;
