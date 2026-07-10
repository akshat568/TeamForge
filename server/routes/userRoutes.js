import express from "express";
import {
  getUserProfile,
  updateUserProfile,
  updateAvatar,
  updateCover,
  getUserProjects,
  getUserActivity,
  searchUsers
} from "../controllers/userController.js";
import { protect, optionalProtect } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/uploadMiddleware.js";

const router = express.Router();

// Search users (Must be registered before /:id)
router.get("/search", searchUsers);

// Public / Private profile getters
router.get("/:id", optionalProtect, getUserProfile);
router.get("/:id/projects", getUserProjects);
router.get("/:id/activity", getUserActivity);

// Profile modifiers (Protected)
router.put("/profile", protect, updateUserProfile);
router.put("/avatar", protect, upload.single("file"), updateAvatar);
router.put("/cover", protect, upload.single("file"), updateCover);

export default router;
