import express from "express";
import {
  getProjectSprints,
  createSprint,
  updateSprint,
  deleteSprint
} from "../controllers/sprintController.js";
import { protect } from "../middleware/authMiddleware.js";
import { verifyWorkspaceAccess } from "../middleware/workspaceMiddleware.js";

const router = express.Router();

router.use(protect);

// Project sprints
router.get("/project/:projectId", verifyWorkspaceAccess, getProjectSprints);
router.post("/project/:projectId", verifyWorkspaceAccess, createSprint);

// Direct sprint actions
router.put("/:sprintId", updateSprint);
router.delete("/:sprintId", deleteSprint);

export default router;
