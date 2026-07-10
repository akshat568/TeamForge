import express from "express";
import {
  getConversations,
  getDirectMessages,
  getProjectMessages,
} from "../controllers/chatController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Secure all endpoints with authentication middleware
router.use(protect);

router.get("/conversations", getConversations);
router.get("/user/:userId", getDirectMessages);
router.get("/project/:projectId", getProjectMessages);

export default router;
