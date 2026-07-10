import express from "express";
import {
  generateTasks,
  getProjectSummary,
  getSprintPlan,
  getReadme,
  getDocumentation,
  getDailyStandup,
  getProjectHealth,
  askChatQuestion,
  getPromptHistory,
} from "../controllers/aiController.js";
import { protect } from "../middleware/authMiddleware.js";
import { verifyWorkspaceAccess } from "../middleware/workspaceMiddleware.js";
console.log("AI ROUTES LOADED");

const router = express.Router();

// Apply auth protection to all endpoints
router.use(protect);

router.post("/generate-tasks", verifyWorkspaceAccess, generateTasks);
router.post("/project-summary", verifyWorkspaceAccess, getProjectSummary);
router.post("/sprint-plan", verifyWorkspaceAccess, getSprintPlan);
router.post("/readme", verifyWorkspaceAccess, getReadme);
router.post("/documentation", verifyWorkspaceAccess, getDocumentation);
router.post("/daily-standup", verifyWorkspaceAccess, getDailyStandup);
router.post("/project-health", verifyWorkspaceAccess, getProjectHealth);
router.post("/chat", verifyWorkspaceAccess, askChatQuestion);
router.get("/history/:projectId", verifyWorkspaceAccess, getPromptHistory);

export default router;
