import Task from "../models/task.js";
import Activity from "../models/activity.js";
import Attachment from "../models/attachment.js";
import cloudinary from "../config/cloudinary.js";
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
    return populatedActivity;
  } catch (error) {
    console.error("Failed to log activity:", error.message);
  }
};

/**
 * @desc    Get all project tasks
 * @route   GET /api/tasks/project/:projectId
 * @access  Private
 */
export const getProjectTasks = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    const tasks = await Task.find({ project: projectId })
      .populate("assignedTo", "name email profilePicture college branch year")
      .populate("createdBy", "name")
      .sort({ createdAt: -1 });

    // Fetch activities for this project to return along with workspace init
    const activities = await Activity.find({ project: projectId })
      .populate("user", "name profilePicture")
      .sort({ createdAt: -1 })
      .limit(30);

    return res.status(200).json({
      success: true,
      tasks,
      activities,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a project task
 * @route   POST /api/tasks/project/:projectId
 * @access  Private
 */
export const createTask = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { title, description, assignedTo, priority, dueDate, startDate, sprint } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Task title is required",
      });
    }

    const task = new Task({
      project: projectId,
      title: title.trim(),
      description: description || "",
      assignedTo: assignedTo || null,
      createdBy: req.user._id,
      priority: priority || "Medium",
      status: "Todo",
      dueDate: dueDate || null,
      startDate: startDate || null,
      sprint: sprint || null,
    });

    // Write successfully to MongoDB FIRST
    const savedTask = await task.save();

    const populatedTask = await Task.findById(savedTask._id)
      .populate("assignedTo", "name email profilePicture college branch year")
      .populate("createdBy", "name");

    // Log Activity & broadcast
    await logActivity(projectId, req.user._id, "created task", populatedTask.title);

    // Emit event ONLY after successful write operations are complete
    const io = getIO();
    if (io) {
      io.to(`project_${projectId}`).emit("task_created", populatedTask);
    }

    // Centralized notifications trigger
    await createWorkspaceNotification({
      projectId,
      senderId: req.user._id,
      type: "task_created",
      title: "New Task Created",
      message: `${req.user.name} created task: ${populatedTask.title}`,
      metadata: { taskId: populatedTask._id },
    });

    if (assignedTo && assignedTo.toString() !== req.user._id.toString()) {
      await createWorkspaceNotification({
        projectId,
        senderId: req.user._id,
        type: "task_assigned",
        title: "Task Assigned to You",
        message: `${req.user.name} assigned you the task: ${populatedTask.title}`,
        metadata: { taskId: populatedTask._id },
        forceRecipients: [assignedTo.toString()],
      });
    }

    return res.status(201).json({
      success: true,
      task: populatedTask,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update task details
 * @route   PUT /api/tasks/:taskId
 * @access  Private
 */
export const updateTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { title, description, assignedTo, priority, status, dueDate, startDate, sprint } = req.body;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    // Verify workspace access for this task's project
    const isMember = await checkProjectMembership(task.project, req.user._id);
    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update tasks in this workspace",
      });
    }

    if (title !== undefined && !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Task title cannot be empty",
      });
    }

    const oldAssignee = task.assignedTo?.toString();

    task.title = title !== undefined ? title.trim() : task.title;
    task.description = description !== undefined ? description : task.description;
    task.assignedTo = assignedTo !== undefined ? (assignedTo || null) : task.assignedTo;
    task.priority = priority !== undefined ? priority : task.priority;
    task.status = status !== undefined ? status : task.status;
    task.dueDate = dueDate !== undefined ? dueDate : task.dueDate;
    task.startDate = startDate !== undefined ? startDate : task.startDate;
    task.sprint = sprint !== undefined ? (sprint || null) : task.sprint;

    // Write successfully to MongoDB FIRST
    const updatedTask = await task.save();

    const populatedTask = await Task.findById(updatedTask._id)
      .populate("assignedTo", "name email profilePicture college branch year")
      .populate("createdBy", "name");

    // Log activity
    await logActivity(task.project, req.user._id, "updated task", populatedTask.title);

    // Emit MINIMAL payload ONLY after successful write operations are complete
    const io = getIO();
    if (io) {
      const minimalPayload = {
        taskId: updatedTask._id.toString(),
        title: updatedTask.title,
        description: updatedTask.description,
        assignedTo: populatedTask.assignedTo, // Populate object so initials display correctly
        priority: updatedTask.priority,
        status: updatedTask.status,
        dueDate: updatedTask.dueDate,
        startDate: updatedTask.startDate,
        sprint: updatedTask.sprint,
        updatedAt: updatedTask.updatedAt, // Timestamp for stale event comparisons
      };
      io.to(`project_${task.project.toString()}`).emit("task_updated", minimalPayload);
    }

    // Centralized notifications trigger
    await createWorkspaceNotification({
      projectId: task.project,
      senderId: req.user._id,
      type: "task_updated",
      title: "Task Updated",
      message: `${req.user.name} updated task: ${populatedTask.title}`,
      metadata: { taskId: populatedTask._id },
    });

    const newAssignee = updatedTask.assignedTo?.toString();
    if (newAssignee && newAssignee !== oldAssignee && newAssignee !== req.user._id.toString()) {
      await createWorkspaceNotification({
        projectId: task.project,
        senderId: req.user._id,
        type: "task_assigned",
        title: "Task Assigned to You",
        message: `${req.user.name} assigned you the task: ${populatedTask.title}`,
        metadata: { taskId: populatedTask._id },
        forceRecipients: [newAssignee],
      });
    }

    return res.status(200).json({
      success: true,
      task: populatedTask,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a task
 * @route   DELETE /api/tasks/:taskId
 * @access  Private
 */
export const deleteTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    const isMember = await checkProjectMembership(task.project, req.user._id);
    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete tasks in this workspace",
      });
    }

    const projectId = task.project;
    const taskTitle = task.title;

    // 1. Clean up associated task files in Cloudinary and references in MongoDB
    const taskAttachments = await Attachment.find({ task: taskId });
    for (const att of taskAttachments) {
      const resourceType = att.fileType === "image" ? "image" : "raw";
      try {
        await cloudinary.uploader.destroy(att.publicId, { resource_type: resourceType });
      } catch (err) {
        console.error(`Failed to delete Cloudinary asset ${att.publicId} for task cleanup:`, err.message);
      }
    }
    await Attachment.deleteMany({ task: taskId });

    // 2. Write successfully to MongoDB FIRST (Delete operation)
    await Task.findByIdAndDelete(taskId);

    // Log Activity & broadcast
    await logActivity(projectId, req.user._id, "deleted task", taskTitle);

    // Emit event ONLY after successful write operations are complete
    const io = getIO();
    if (io) {
      io.to(`project_${projectId.toString()}`).emit("task_deleted", { taskId });
    }

    // Centralized notifications trigger
    await createWorkspaceNotification({
      projectId,
      senderId: req.user._id,
      type: "task_deleted",
      title: "Task Deleted",
      message: `${req.user.name} deleted task: ${taskTitle}`,
      metadata: { taskId },
    });

    return res.status(200).json({
      success: true,
      message: "Task deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update only task status
 * @route   PATCH /api/tasks/:taskId/status
 * @access  Private
 */
export const updateTaskStatus = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;

    if (!["Todo", "In Progress", "Completed"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value",
      });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    const isMember = await checkProjectMembership(task.project, req.user._id);
    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update task status in this workspace",
      });
    }

    task.status = status;
    
    // Write successfully to MongoDB FIRST
    await task.save();

    const populatedTask = await Task.findById(task._id)
      .populate("assignedTo", "name email profilePicture college branch year")
      .populate("createdBy", "name");

    // Log activity
    const actionLabel = status === "Completed" ? "completed task" : `moved task to ${status.toLowerCase()}`;
    await logActivity(task.project, req.user._id, actionLabel, task.title);

    // Emit MINIMAL payload ONLY after successful write operations are complete
    const io = getIO();
    if (io) {
      io.to(`project_${task.project.toString()}`).emit("task_status_changed", {
        taskId: task._id.toString(),
        status: task.status,
        updatedAt: task.updatedAt, // Timestamp for stale event comparisons
      });
    }

    // Centralized notifications trigger
    if (status === "Completed") {
      await createWorkspaceNotification({
        projectId: task.project,
        senderId: req.user._id,
        type: "task_completed",
        title: "Task Completed",
        message: `${req.user.name} completed task: ${populatedTask.title}`,
        metadata: { taskId: populatedTask._id },
      });
    } else {
      await createWorkspaceNotification({
        projectId: task.project,
        senderId: req.user._id,
        type: "task_updated",
        title: "Task Status Updated",
        message: `${req.user.name} moved task "${populatedTask.title}" to ${status.toLowerCase()}`,
        metadata: { taskId: populatedTask._id },
      });
    }

    return res.status(200).json({
      success: true,
      task: populatedTask,
    });
  } catch (error) {
    next(error);
  }
};
