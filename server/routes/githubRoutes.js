import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getRepositoryInfo,
  getCommitsList,
  getContributorsList,
  getIssuesList,
  getPullRequestsList
} from "../controllers/githubController.js";

const router = express.Router();

// All GitHub API routes are protected by auth token verification
router.get("/repository/:projectId", protect, getRepositoryInfo);
router.get("/commits/:projectId", protect, getCommitsList);
router.get("/contributors/:projectId", protect, getContributorsList);
router.get("/issues/:projectId", protect, getIssuesList);
router.get("/pulls/:projectId", protect, getPullRequestsList);

export default router;
