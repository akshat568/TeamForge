import express from "express";
import {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  getMyProjects,
  getUserWorkspaces,
  getProjectTeam,
} from "../controllers/projectController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes first or general mappings
router.get("/", getProjects);
router.get("/my-projects", protect, getMyProjects);
router.get("/user-workspaces", protect, getUserWorkspaces);
router.get("/:id/team", protect, getProjectTeam);
router.get("/:id", getProjectById);

// Protected mutation routes
router.post("/", protect, createProject);
router.put("/:id", protect, updateProject);
router.delete("/:id", protect, deleteProject);

export default router;
