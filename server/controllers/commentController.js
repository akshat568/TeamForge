import Comment from "../models/comment.js";
import Task from "../models/task.js";
import User from "../models/user.js";
import Project from "../models/project.js";
import Application from "../models/application.js";
import { getIO } from "../socket.js";
import { createWorkspaceNotification } from "../services/notificationService.js";

/**
 * @desc    Get all comments for a task
 * @route   GET /api/tasks/:taskId/comments
 * @access  Private
 */
export const getTaskComments = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const comments = await Comment.find({ task: taskId })
      .populate("author", "name profilePicture")
      .sort({ createdAt: 1 }); // Newest comments at bottom

    return res.status(200).json({
      success: true,
      comments
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a comment
 * @route   POST /api/tasks/:taskId/comments
 * @access  Private
 */
export const createComment = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Comment message cannot be empty"
      });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found"
      });
    }

    const comment = await Comment.create({
      task: taskId,
      project: task.project,
      author: req.user._id,
      message: message.trim()
    });

    const populatedComment = await Comment.findById(comment._id)
      .populate("author", "name profilePicture");

    // Broadcast to project room
    const io = getIO();
    if (io) {
      io.to(`project_${task.project.toString()}`).emit("comment_created", populatedComment);
    }

    // Process Mentions: @name
    const mentionRegex = /@([a-zA-Z0-9_\s.-]+)/g;
    const matches = message.match(mentionRegex);
    if (matches) {
      // Find workspace/project team members
      const projectObj = await Project.findById(task.project);
      const acceptedApps = await Application.find({ project: task.project, status: "accepted" }).select("applicant");
      const memberIds = [projectObj.creator.toString(), ...acceptedApps.map(a => a.applicant.toString())];

      for (const match of matches) {
        const queryTerm = match.replace("@", "").trim();
        if (!queryTerm) continue;

        // Search for user in workspace matches
        const matchedUsers = await User.find({
          _id: { $in: memberIds },
          $or: [
            { name: { $regex: queryTerm, $options: "i" } },
            { email: { $regex: queryTerm, $options: "i" } }
          ]
        });

        for (const user of matchedUsers) {
          if (user._id.toString() !== req.user._id.toString()) {
            await createWorkspaceNotification({
              projectId: task.project,
              senderId: req.user._id,
              type: "comment_added",
              title: "Mentioned in Task Comment",
              message: `${req.user.name} mentioned you in task: ${task.title}`,
              metadata: { taskId: task._id, commentId: comment._id },
              forceRecipients: [user._id.toString()]
            });
          }
        }
      }
    }

    return res.status(201).json({
      success: true,
      comment: populatedComment
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update own comment
 * @route   PUT /api/comments/:commentId
 * @access  Private
 */
export const updateComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Comment message cannot be empty"
      });
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found"
      });
    }

    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only edit your own comments"
      });
    }

    comment.message = message.trim();
    comment.edited = true;
    await comment.save();

    const populatedComment = await Comment.findById(comment._id)
      .populate("author", "name profilePicture");

    // Broadcast update to project room
    const io = getIO();
    if (io) {
      io.to(`project_${comment.project.toString()}`).emit("comment_updated", populatedComment);
    }

    return res.status(200).json({
      success: true,
      comment: populatedComment
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete own comment
 * @route   DELETE /api/comments/:commentId
 * @access  Private
 */
export const deleteComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found"
      });
    }

    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own comments"
      });
    }

    await Comment.findByIdAndDelete(commentId);

    // Broadcast delete to project room
    const io = getIO();
    if (io) {
      io.to(`project_${comment.project.toString()}`).emit("comment_deleted", {
        commentId,
        taskId: comment.task.toString()
      });
    }

    return res.status(200).json({
      success: true,
      message: "Comment deleted successfully"
    });
  } catch (error) {
    next(error);
  }
};
