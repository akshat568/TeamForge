import Attachment from "../models/attachment.js";
import Project from "../models/project.js";
import Application from "../models/application.js";
import Activity from "../models/activity.js";
import { getIO } from "../socket.js";
import cloudinary from "../config/cloudinary.js";
import { createWorkspaceNotification } from "../services/notificationService.js";

/**
 * Helper to log workspace activity and broadcast it in real-time
 */
const logActivity = async (projectId, userId, action, target) => {
  try {
    const activity = await Activity.create({
      project: projectId,
      user: userId,
      action,
      target,
    });

    const populatedActivity = await Activity.findById(activity._id)
      .populate("user", "name profilePicture");

    const io = getIO();
    if (io) {
      io.to(`project_${projectId}`).emit("activity_logged", populatedActivity);
    }
    return populatedActivity;
  } catch (error) {
    console.error("Failed to log activity:", error.message);
  }
};

/**
 * Helper to stream upload buffers directly to Cloudinary
 */
const uploadToCloudinary = (fileBuffer, folder) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "auto" },
      (error, result) => {
        if (error) return reject(error);
        console.log("Cloudinary Upload Result:", result);
        resolve(result);
      }
    );
    uploadStream.end(fileBuffer);
  });
};

/**
 * @desc    Upload document or task attachment
 * @route   POST /api/attachments/upload
 * @access  Private
 */
export const uploadAttachment = async (req, res, next) => {
  try {
    const { projectId, taskId } = req.body;

    if (!projectId) {
      return res.status(400).json({ success: false, message: "Project ID is required" });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: "Please upload a file" });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: "Project workspace not found" });
    }

    // 1. Duplicate upload check
    const existing = await Attachment.findOne({
      project: projectId,
      task: taskId || null,
      originalName: req.file.originalname,
      fileSize: req.file.size
    }).populate("uploadedBy", "name profilePicture");

    if (existing) {
      return res.status(200).json({
        success: true,
        attachment: existing,
        duplicate: true
      });
    }

    // 2. Perform Cloudinary folder organized upload
    const folderPath = taskId 
      ? `TeamForge/${projectId}/tasks/${taskId}` 
      : `TeamForge/${projectId}/documents`;

    const cloudRes = await uploadToCloudinary(req.file.buffer, folderPath);

    // 3. Save attachment metadata to MongoDB
    const ext = req.file.originalname.split(".").pop().toLowerCase();
    const getFileType = (extName) => {
      if (["jpg", "jpeg", "png", "gif", "webp"].includes(extName)) return "image";
      if (extName === "pdf") return "pdf";
      if (["doc", "docx"].includes(extName)) return "word";
      if (["ppt", "pptx"].includes(extName)) return "powerpoint";
      if (["xls", "xlsx"].includes(extName)) return "excel";
      if (["zip", "rar"].includes(extName)) return "archive";
      if (extName === "txt") return "text";
      return "other";
    };
    const fileType = getFileType(ext);

    const attachment = new Attachment({
      project: projectId,
      task: taskId || null,
      fileName: req.file.originalname,
      originalName: req.file.originalname,
      fileUrl: cloudRes.secure_url,
      publicId: cloudRes.public_id,
      mimeType: req.file.mimetype,
      fileType,
      fileSize: req.file.size,
      uploadedBy: req.user._id
    });

    const savedAttachment = await attachment.save();
    const populatedAttachment = await Attachment.findById(savedAttachment._id)
      .populate("uploadedBy", "name profilePicture");

    // 4. Log Workspace Activity
    const activityAction = taskId ? "attached file to task" : "uploaded document";
    await logActivity(projectId, req.user._id, activityAction, populatedAttachment.fileName);

    // 5. Create Notifications for other members
    await createWorkspaceNotification({
      projectId,
      senderId: req.user._id,
      type: "document_uploaded",
      title: taskId ? "Task Attachment Uploaded" : "New Document Uploaded",
      message: `${req.user.name} uploaded file: ${populatedAttachment.fileName}`,
      metadata: { documentId: populatedAttachment._id, taskId },
    });

    // 6. Broadcast socket update only after successful database commits are complete
    const io = getIO();
    if (io) {
      io.to(`project_${projectId}`).emit("attachment_uploaded", populatedAttachment);
    }

    return res.status(201).json({
      success: true,
      attachment: populatedAttachment
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get paginated workspace documents
 * @route   GET /api/attachments/project/:projectId
 * @access  Private
 */
export const getProjectAttachments = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 25;
    const skip = (page - 1) * limit;

    const attachments = await Attachment.find({ project: projectId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("uploadedBy", "name profilePicture");

    const total = await Attachment.countDocuments({ project: projectId });

    return res.status(200).json({
      success: true,
      attachments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get task attachments list
 * @route   GET /api/attachments/task/:taskId
 * @access  Private
 */
export const getTaskAttachments = async (req, res, next) => {
  try {
    const { taskId } = req.params;

    const attachments = await Attachment.find({ task: taskId })
      .sort({ createdAt: -1 })
      .populate("uploadedBy", "name profilePicture");

    return res.status(200).json({
      success: true,
      attachments
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete document/attachment
 * @route   DELETE /api/attachments/:attachmentId
 * @access  Private
 */
export const deleteAttachment = async (req, res, next) => {
  try {
    const { attachmentId } = req.params;

    const attachment = await Attachment.findById(attachmentId);
    if (!attachment) {
      return res.status(404).json({ success: false, message: "Attachment not found" });
    }

    const project = await Project.findById(attachment.project);
    if (!project) {
      return res.status(404).json({ success: false, message: "Associated project workspace not found" });
    }

    // Authorization: Only creator or uploader can delete
    if (
      attachment.uploadedBy.toString() !== req.user._id.toString() &&
      project.creator.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ success: false, message: "Not authorized to delete this file" });
    }

    // 1. Delete asset from Cloudinary FIRST. If it fails, preserve MongoDB reference.
    const resourceType = attachment.fileType === "image" ? "image" : "raw";
    try {
      const cloudRes = await cloudinary.uploader.destroy(attachment.publicId, { resource_type: resourceType });
      if (cloudRes.result !== "ok" && cloudRes.result !== "not found") {
        throw new Error("Cloudinary returned non-ok result: " + cloudRes.result);
      }
    } catch (err) {
      console.error("Cloudinary destroy failed:", err.message);
      return res.status(500).json({ 
        success: false, 
        message: "Failed to delete file from cloud storage. Database reference preserved." 
      });
    }

    // 2. Remove Mongoose document
    await Attachment.findByIdAndDelete(attachmentId);

    // 3. Log Activity
    const label = attachment.task ? "deleted task attachment" : "deleted document";
    await logActivity(attachment.project, req.user._id, label, attachment.fileName);

    // 4. Emit socket event only after successful writes are complete
    const io = getIO();
    if (io) {
      io.to(`project_${attachment.project.toString()}`).emit("attachment_deleted", {
        attachmentId,
        taskId: attachment.task ? attachment.task.toString() : null
      });
    }

    // Centralized notifications trigger
    await createWorkspaceNotification({
      projectId: attachment.project,
      senderId: req.user._id,
      type: "document_deleted",
      title: attachment.task ? "Task Attachment Removed" : "Document Deleted",
      message: `${req.user.name} deleted file: ${attachment.fileName}`,
      metadata: { documentId: attachmentId, taskId: attachment.task },
    });

    return res.status(200).json({
      success: true,
      message: "Attachment deleted successfully"
    });
  } catch (error) {
    next(error);
  }
};
