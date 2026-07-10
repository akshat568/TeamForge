import express from "express";
import {
  getProjectTasks,
  createTask,
  updateTask,
  deleteTask,
  updateTaskStatus,
} from "../controllers/taskController.js";
import { protect } from "../middleware/authMiddleware.js";
import { verifyWorkspaceAccess } from "../middleware/workspaceMiddleware.js";

const router = express.Router();

// Protect all endpoints with JWT auth
router.use(protect);

router.get("/project/:projectId", verifyWorkspaceAccess, getProjectTasks);
router.post("/project/:projectId", verifyWorkspaceAccess, createTask);
router.put("/:taskId", updateTask);
router.delete("/:taskId", deleteTask);
router.patch("/:taskId/status", updateTaskStatus);

export default router;
