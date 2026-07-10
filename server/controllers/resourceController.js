import Resource from "../models/resource.js";
import Activity from "../models/activity.js";
import { getIO, checkProjectMembership } from "../socket.js";
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
  } catch (error) {
    console.error("Failed to log activity:", error.message);
  }
};

/**
 * @desc    Get all project resources
 * @route   GET /api/resources/project/:projectId
 * @access  Private
 */
export const getProjectResources = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    const resources = await Resource.find({ project: projectId })
      .populate("uploadedBy", "name profilePicture")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      resources,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add a resource link
 * @route   POST /api/resources/project/:projectId
 * @access  Private
 */
export const createResource = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { fileName, fileUrl, type } = req.body;

    if (!fileName || !fileName.trim()) {
      return res.status(400).json({
        success: false,
        message: "Resource title/name is required",
      });
    }

    if (!fileUrl || !fileUrl.trim()) {
      return res.status(400).json({
        success: false,
        message: "Resource URL link is required",
      });
    }

    const resource = new Resource({
      project: projectId,
      uploadedBy: req.user._id,
      fileName: fileName.trim(),
      fileUrl: fileUrl.trim(),
      type: type || "Link",
    });

    const savedResource = await resource.save();

    const populatedResource = await Resource.findById(savedResource._id)
      .populate("uploadedBy", "name profilePicture");

    // Log Activity & broadcast
    await logActivity(projectId, req.user._id, "uploaded resource", populatedResource.fileName);

    const io = getIO();
    if (io) {
      io.to(`project_${projectId}`).emit("resource_uploaded", populatedResource);
    }

    // Centralized notifications trigger
    await createWorkspaceNotification({
      projectId,
      senderId: req.user._id,
      type: "resource_uploaded",
      title: "Resource Shared",
      message: `${req.user.name} added resource link: ${populatedResource.fileName}`,
      metadata: { resourceId: populatedResource._id },
    });

    return res.status(201).json({
      success: true,
      resource: populatedResource,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a resource
 * @route   DELETE /api/resources/:resourceId
 * @access  Private
 */
export const deleteResource = async (req, res, next) => {
  try {
    const { resourceId } = req.params;

    const resource = await Resource.findById(resourceId);
    if (!resource) {
      return res.status(404).json({
        success: false,
        message: "Resource link not found",
      });
    }

    const isMember = await checkProjectMembership(resource.project, req.user._id);
    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete resources in this workspace",
      });
    }

    const projectId = resource.project;
    const resourceName = resource.fileName;

    await Resource.findByIdAndDelete(resourceId);

    // Log Activity & broadcast
    await logActivity(projectId, req.user._id, "deleted resource", resourceName);

    const io = getIO();
    if (io) {
      io.to(`project_${projectId.toString()}`).emit("resource_deleted", { resourceId });
    }

    // Centralized notifications trigger
    await createWorkspaceNotification({
      projectId,
      senderId: req.user._id,
      type: "resource_deleted",
      title: "Resource Link Removed",
      message: `${req.user.name} deleted resource link: ${resourceName}`,
      metadata: { resourceId },
    });

    return res.status(200).json({
      success: true,
      message: "Resource link deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
