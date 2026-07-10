import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { verifyWorkspaceAccess } from "../middleware/workspaceMiddleware.js";
import { upload } from "../middleware/uploadMiddleware.js";
import {
  uploadAttachment,
  getProjectAttachments,
  getTaskAttachments,
  deleteAttachment
} from "../controllers/attachmentController.js";

const router = express.Router();

// Enforce JWT protect globally
router.use(protect);

router.post("/upload", upload.single("file"), verifyWorkspaceAccess, uploadAttachment);
router.get("/project/:projectId", verifyWorkspaceAccess, getProjectAttachments);
router.get("/task/:taskId", getTaskAttachments);
router.delete("/:attachmentId", deleteAttachment);

export default router;
