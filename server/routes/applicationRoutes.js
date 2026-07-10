import express from "express";
import {
  createApplication,
  getMyApplications,
  getProjectApplications,
  updateApplicationStatus,
} from "../controllers/applicationController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

router.post("/", createApplication);
router.get("/my-applications", getMyApplications);
router.get("/project/:projectId", getProjectApplications);
router.put("/:id/status", updateApplicationStatus);

export default router;
