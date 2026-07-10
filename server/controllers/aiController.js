import Project from "../models/project.js";
import Task from "../models/task.js";
import Resource from "../models/resource.js";
import Attachment from "../models/attachment.js";
import Activity from "../models/activity.js";
import Application from "../models/application.js";
import AiHistory from "../models/aiHistory.js";
import { aiService } from "../services/aiService.js";

// Helper to construct project context map from database records
const buildProjectContext = async (projectId) => {
  const project = await Project.findById(projectId).populate("creator", "name email");
  if (!project) {
    throw new Error("Project not found");
  }

  const tasks = await Task.find({ project: projectId }).populate("assignedTo", "name");
  const resources = await Resource.find({ project: projectId }).populate("uploadedBy", "name");
  const attachments = await Attachment.find({ project: projectId }).populate("uploadedBy", "name");
  const activities = await Activity.find({ project: projectId })
    .populate("user", "name")
    .sort({ createdAt: -1 })
    .limit(15);
  const acceptedApps = await Application.find({ project: projectId, status: "accepted" })
    .populate("applicant", "name email");

  const team = [
    { name: project.creator.name, role: "Lead" },
    ...acceptedApps
      .map((app) => (app.applicant ? { name: app.applicant.name, role: "Member" } : null))
      .filter(Boolean),
  ];

  return {
    title: project.title,
    description: project.description,
    tasks: tasks.map((t) => ({
      title: t.title,
      status: t.status,
      assignee: t.assignedTo?.name || "Unassigned",
    })),
    resources: resources.map((r) => ({
      name: r.fileName,
      url: r.fileUrl,
      uploadedBy: r.uploadedBy?.name || "Member",
    })),
    documents: attachments.map((a) => ({
      name: a.fileName,
      uploadedBy: a.uploadedBy?.name || "Member",
    })),
    activities: activities.map(
      (a) => `${a.user?.name || "Someone"} ${a.action} "${a.target}"`
    ),
    team,
  };
};

/**
 * @desc    Generate a structured task breakdown
 * @route   POST /api/ai/generate-tasks
 * @access  Private
 */
export const generateTasks = async (req, res, next) => {
  try {
    const { projectId } = req.body;
    if (!projectId) {
      return res.status(400).json({ success: false, message: "Project ID is required" });
    }

    const context = await buildProjectContext(projectId);
    const result = await aiService.generateTasks(context);

    // Save prompt audit log
    await AiHistory.create({
      project: projectId,
      user: req.user._id,
      actionType: "generate-tasks",
      promptText: `Generate sprint tasks for project "${context.title}"`,
      responsePayload: result,
    });

    return res.status(200).json({
      success: true,
      tasks: result.tasks || [],
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Generate progress summary, risks and suggestions
 * @route   POST /api/ai/project-summary
 * @access  Private
 */
export const getProjectSummary = async (req, res, next) => {
  try {
    const { projectId } = req.body;
    if (!projectId) {
      return res.status(400).json({ success: false, message: "Project ID is required" });
    }

    const context = await buildProjectContext(projectId);
    const result = await aiService.getProjectSummary(context);

    await AiHistory.create({
      project: projectId,
      user: req.user._id,
      actionType: "project-summary",
      promptText: `Evaluate status summary for project "${context.title}"`,
      responsePayload: result,
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Generate week-by-week sprint roadmap plan
 * @route   POST /api/ai/sprint-plan
 * @access  Private
 */
export const getSprintPlan = async (req, res, next) => {
  try {
    const { projectId } = req.body;
    if (!projectId) {
      return res.status(400).json({ success: false, message: "Project ID is required" });
    }

    const context = await buildProjectContext(projectId);
    const result = await aiService.getSprintPlan(context);

    await AiHistory.create({
      project: projectId,
      user: req.user._id,
      actionType: "sprint-plan",
      promptText: `Create week-by-week roadmap for project "${context.title}"`,
      responsePayload: result,
    });

    return res.status(200).json({
      success: true,
      weeks: result.weeks || [],
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Generate formatted README.md markdown
 * @route   POST /api/ai/readme
 * @access  Private
 */
export const getReadme = async (req, res, next) => {
  try {
    const { projectId } = req.body;
    if (!projectId) {
      return res.status(400).json({ success: false, message: "Project ID is required" });
    }

    const context = await buildProjectContext(projectId);
    const result = await aiService.getReadme(context);

    await AiHistory.create({
      project: projectId,
      user: req.user._id,
      actionType: "readme",
      promptText: `Generate README.md file template for project "${context.title}"`,
      responsePayload: result,
    });

    return res.status(200).json({
      success: true,
      markdown: result.markdown || "",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Generate developers architecture docs markdown
 * @route   POST /api/ai/documentation
 * @access  Private
 */
export const getDocumentation = async (req, res, next) => {
  try {
    const { projectId } = req.body;
    if (!projectId) {
      return res.status(400).json({ success: false, message: "Project ID is required" });
    }

    const context = await buildProjectContext(projectId);
    const result = await aiService.getDocumentation(context);

    await AiHistory.create({
      project: projectId,
      user: req.user._id,
      actionType: "documentation",
      promptText: `Generate architecture developer docs for project "${context.title}"`,
      responsePayload: result,
    });

    return res.status(200).json({
      success: true,
      markdown: result.markdown || "",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Generate standup report mapping activities logs
 * @route   POST /api/ai/daily-standup
 * @access  Private
 */
export const getDailyStandup = async (req, res, next) => {
  try {
    const { projectId } = req.body;
    if (!projectId) {
      return res.status(400).json({ success: false, message: "Project ID is required" });
    }

    const context = await buildProjectContext(projectId);
    const result = await aiService.getDailyStandup(context);

    await AiHistory.create({
      project: projectId,
      user: req.user._id,
      actionType: "daily-standup",
      promptText: `Synthesize daily standup for project "${context.title}"`,
      responsePayload: result,
    });

    return res.status(200).json({
      success: true,
      yesterday: result.yesterday || "",
      today: result.today || "",
      blockers: result.blockers || "",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Analyze project health metrics and suggest QA adjustments
 * @route   POST /api/ai/project-health
 * @access  Private
 */
export const getProjectHealth = async (req, res, next) => {
  try {
    const { projectId } = req.body;
    if (!projectId) {
      return res.status(400).json({ success: false, message: "Project ID is required" });
    }

    const context = await buildProjectContext(projectId);
    const result = await aiService.getProjectHealth(context);

    await AiHistory.create({
      project: projectId,
      user: req.user._id,
      actionType: "project-health",
      promptText: `Evaluate health metrics score for project "${context.title}"`,
      responsePayload: result,
    });

    return res.status(200).json({
      success: true,
      healthScore: result.healthScore || 0,
      status: result.status || "Unknown",
      suggestions: result.suggestions || "",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Ask a custom conversational question about the project workspace
 * @route   POST /api/ai/chat
 * @access  Private
 */
export const askChatQuestion = async (req, res, next) => {
  try {
    const { projectId, message, history } = req.body;
    if (!projectId || !message) {
      return res.status(400).json({ success: false, message: "Project ID and message are required" });
    }

    const context = await buildProjectContext(projectId);
    const result = await aiService.askChatQuestion(context, message, history || []);

    await AiHistory.create({
      project: projectId,
      user: req.user._id,
      actionType: "chat",
      promptText: message,
      responsePayload: result,
    });

    return res.status(200).json({
      success: true,
      response: result.response || "",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get AI Prompt generation history for a project workspace
 * @route   GET /api/ai/history/:projectId
 * @access  Private
 */
export const getPromptHistory = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    if (!projectId) {
      return res.status(400).json({ success: false, message: "Project ID is required" });
    }

    const history = await AiHistory.find({ project: projectId })
      .populate("user", "name")
      .sort({ createdAt: -1 })
      .limit(30);

    return res.status(200).json({
      success: true,
      count: history.length,
      history,
    });
  } catch (error) {
    next(error);
  }
};
