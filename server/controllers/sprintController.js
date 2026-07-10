import Sprint from "../models/sprint.js";
import Task from "../models/task.js";
import Project from "../models/project.js";
import { getIO } from "../socket.js";

/**
 * @desc    Get all project sprints (with stats)
 * @route   GET /api/projects/:projectId/sprints
 * @access  Private
 */
export const getProjectSprints = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const sprints = await Sprint.find({ project: projectId }).sort({ startDate: 1 });

    const sprintsWithStats = await Promise.all(
      sprints.map(async (sprint) => {
        const totalTasks = await Task.countDocuments({ sprint: sprint._id });
        const completedTasks = await Task.countDocuments({ sprint: sprint._id, status: "Completed" });
        const remainingTasks = totalTasks - completedTasks;
        const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        return {
          ...sprint.toObject(),
          stats: {
            totalTasks,
            completedTasks,
            remainingTasks,
            completionRate
          }
        };
      })
    );

    return res.status(200).json({
      success: true,
      sprints: sprintsWithStats
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a sprint
 * @route   POST /api/projects/:projectId/sprints
 * @access  Private
 */
export const createSprint = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { name, goal, startDate, endDate } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Sprint name is required"
      });
    }

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Sprint start and end dates are required"
      });
    }

    const sprint = await Sprint.create({
      project: projectId,
      name: name.trim(),
      goal: goal || "",
      startDate,
      endDate
    });

    const io = getIO();
    if (io) {
      io.to(`project_${projectId}`).emit("sprint_updated", sprint);
    }

    return res.status(201).json({
      success: true,
      sprint
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update sprint details
 * @route   PUT /api/sprints/:sprintId
 * @access  Private
 */
export const updateSprint = async (req, res, next) => {
  try {
    const { sprintId } = req.params;
    const { name, goal, startDate, endDate, status } = req.body;

    const sprint = await Sprint.findById(sprintId);
    if (!sprint) {
      return res.status(404).json({
        success: false,
        message: "Sprint not found"
      });
    }

    sprint.name = name !== undefined ? name.trim() : sprint.name;
    sprint.goal = goal !== undefined ? goal : sprint.goal;
    sprint.startDate = startDate !== undefined ? startDate : sprint.startDate;
    sprint.endDate = endDate !== undefined ? endDate : sprint.endDate;
    sprint.status = status !== undefined ? status : sprint.status;

    await sprint.save();

    const io = getIO();
    if (io) {
      io.to(`project_${sprint.project.toString()}`).emit("sprint_updated", sprint);
    }

    return res.status(200).json({
      success: true,
      sprint
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a sprint
 * @route   DELETE /api/sprints/:sprintId
 * @access  Private
 */
export const deleteSprint = async (req, res, next) => {
  try {
    const { sprintId } = req.params;
    const sprint = await Sprint.findById(sprintId);
    if (!sprint) {
      return res.status(404).json({
        success: false,
        message: "Sprint not found"
      });
    }

    const projectId = sprint.project.toString();

    // Reset tasks assigned to this sprint
    await Task.updateMany({ sprint: sprintId }, { $set: { sprint: null } });
    await Sprint.findByIdAndDelete(sprintId);

    const io = getIO();
    if (io) {
      io.to(`project_${projectId}`).emit("sprint_updated", { sprintId, deleted: true });
    }

    return res.status(200).json({
      success: true,
      message: "Sprint deleted successfully"
    });
  } catch (error) {
    next(error);
  }
};
