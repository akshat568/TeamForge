import express from "express";
import {
  getProjectResources,
  createResource,
  deleteResource,
} from "../controllers/resourceController.js";
import { protect } from "../middleware/authMiddleware.js";
import { verifyWorkspaceAccess } from "../middleware/workspaceMiddleware.js";

const router = express.Router();

// Protect all endpoints with JWT auth
router.use(protect);

router.get("/project/:projectId", verifyWorkspaceAccess, getProjectResources);
router.post("/project/:projectId", verifyWorkspaceAccess, createResource);
router.delete("/:resourceId", deleteResource);

export default router;
