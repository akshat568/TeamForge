import express from "express";
import {
  getTaskComments,
  createComment,
  updateComment,
  deleteComment
} from "../controllers/commentController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

// Task comments (nested style)
router.get("/task/:taskId", getTaskComments);
router.post("/task/:taskId", createComment);

// Direct comment actions
router.put("/:commentId", updateComment);
router.delete("/:commentId", deleteComment);

export default router;
