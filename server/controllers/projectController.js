import Project from "../models/project.js";
import Application from "../models/application.js";
import Attachment from "../models/attachment.js";
import cloudinary from "../config/cloudinary.js";
import { checkProjectMembership } from "../socket.js";
import { createWorkspaceNotification } from "../services/notificationService.js";

/**
 * @desc    Create a new project listing
 * @route   POST /api/projects
 * @access  Private
 */
export const createProject = async (req, res, next) => {
  try {
    const { title, description, category, skillsRequired, roles, githubUrl, githubRepository, maxTeamSize } = req.body;

    // 1. Mandatory checks
    if (!title || !description || !category || !skillsRequired) {
      return res.status(400).json({
        success: false,
        message: "Please enter all required fields",
      });
    }

    // Parse skillsRequired if passed as a string
    let parsedSkills = skillsRequired;
    if (typeof skillsRequired === "string") {
      parsedSkills = skillsRequired.split(",").map((s) => s.trim()).filter(Boolean);
    }

    // 2. Build project document
    const project = new Project({
      title,
      description,
      creator: req.user._id,
      category,
      skillsRequired: parsedSkills,
      roles: roles || [],
      githubUrl: githubUrl || "",
      githubRepository: githubRepository || "",
      maxTeamSize: maxTeamSize || 10,
      currentTeamSize: 1, // Automatically set creator as the first member
    });

    const savedProject = await project.save();

    // Centralized notifications trigger
    await createWorkspaceNotification({
      projectId: savedProject._id,
      senderId: req.user._id,
      type: "workspace_created",
      title: "Workspace Created",
      message: `You created project workspace: ${savedProject.title}`,
      metadata: { projectId: savedProject._id },
      forceRecipients: [req.user._id.toString()]
    });

    return res.status(201).json({
      success: true,
      project: savedProject,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all project listings with search and filters
 * @route   GET /api/projects
 * @access  Public
 */
export const getProjects = async (req, res, next) => {
  try {
    const { search, category, skills } = req.query;
    const query = {};

    // 1. Category filter
    if (category) {
      query.category = category;
    }

    // 2. Skills filter (comma-separated skills query)
    if (skills) {
      const skillsArray = skills.split(",").map((s) => s.trim()).filter(Boolean);
      if (skillsArray.length > 0) {
        query.skillsRequired = { $in: skillsArray.map(s => new RegExp(`^${s}$`, "i")) };
      }
    }

    // 3. General query string search
    if (search) {
      const searchRegex = new RegExp(search, "i");
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { skillsRequired: searchRegex },
      ];
    }

    // Fetch projects populated with creator profile information
    const projects = await Project.find(query)
      .populate("creator", "name college year branch profilePicture")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: projects.length,
      projects,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single project details
 * @route   GET /api/projects/:id
 * @access  Public
 */
export const getProjectById = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id).populate(
      "creator",
      "name email college year branch bio profilePicture github linkedin"
    );

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project listing not found",
      });
    }

    return res.status(200).json({
      success: true,
      project,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update project listing details
 * @route   PUT /api/projects/:id
 * @access  Private
 */
export const updateProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project listing not found",
      });
    }

    // Verify creator authorization
    if (project.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to edit this project listing",
      });
    }

    const { title, description, category, skillsRequired, roles, githubUrl, githubRepository, maxTeamSize, status } = req.body;

    if (title) project.title = title;
    if (description) project.description = description;
    if (category) project.category = category;
    if (githubUrl !== undefined) project.githubUrl = githubUrl;
    if (maxTeamSize) project.maxTeamSize = maxTeamSize;
    if (status) project.status = status;

    const wasRepoLinked = githubRepository !== undefined && githubRepository && githubRepository !== project.githubRepository;

    if (githubRepository !== undefined) {
      if (githubRepository && !/^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+$/.test(githubRepository)) {
        return res.status(400).json({
          success: false,
          message: "Invalid GitHub repository format. Must be 'owner/repository'.",
        });
      }
      project.githubRepository = githubRepository;
    }

    if (skillsRequired) {
      project.skillsRequired = typeof skillsRequired === "string"
        ? skillsRequired.split(",").map((s) => s.trim()).filter(Boolean)
        : skillsRequired;
    }

    if (roles) {
      project.roles = roles;
    }

    const updatedProject = await project.save();

    if (wasRepoLinked) {
      await createWorkspaceNotification({
        projectId: updatedProject._id,
        senderId: req.user._id,
        type: "github_connected",
        title: "GitHub Repository Connected",
        message: `${req.user.name} linked GitHub repository: ${updatedProject.githubRepository}`,
        metadata: { projectId: updatedProject._id },
      });
    }

    return res.status(200).json({
      success: true,
      project: updatedProject,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete project listing
 * @route   DELETE /api/projects/:id
 * @access  Private
 */
export const deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project listing not found",
      });
    }

    // Verify creator authorization
    if (project.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this project listing",
      });
    }

    // 1. Clean up associated files in Cloudinary and references in MongoDB
    const projectAttachments = await Attachment.find({ project: req.params.id });
    for (const att of projectAttachments) {
      const resourceType = att.fileType === "image" ? "image" : "raw";
      try {
        await cloudinary.uploader.destroy(att.publicId, { resource_type: resourceType });
      } catch (err) {
        console.error(`Failed to delete Cloudinary asset ${att.publicId} for project cleanup:`, err.message);
      }
    }
    await Attachment.deleteMany({ project: req.params.id });

    // 2. Delete project listing
    await Project.deleteOne({ _id: req.params.id });

    return res.status(200).json({
      success: true,
      message: "Project listing deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current user's projects
 * @route   GET /api/projects/my-projects
 * @access  Private
 */
export const getMyProjects = async (req, res, next) => {
  try {
    const projects = await Project.find({ creator: req.user._id })
      .populate("creator", "name college year branch profilePicture")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: projects.length,
      projects,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all workspaces the current user belongs to (Creator or Teammate)
 * @route   GET /api/projects/user-workspaces
 * @access  Private
 */
export const getUserWorkspaces = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // 1. Projects created by user
    const createdProjects = await Project.find({ creator: userId })
      .populate("creator", "name college year branch profilePicture");

    // 2. Projects where user has accepted membership applications
    const acceptedApps = await Application.find({
      applicant: userId,
      status: "accepted",
    }).populate({
      path: "project",
      populate: {
        path: "creator",
        select: "name college year branch profilePicture",
      },
    });

    const joinedProjects = acceptedApps.map((app) => app.project).filter(Boolean);

    // De-duplicate projects (using Map)
    const workspacesMap = new Map();
    createdProjects.forEach((p) => workspacesMap.set(p._id.toString(), p));
    joinedProjects.forEach((p) => workspacesMap.set(p._id.toString(), p));
    const workspaces = Array.from(workspacesMap.values());

    return res.status(200).json({
      success: true,
      count: workspaces.length,
      workspaces,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get members of a project team workspace
 * @route   GET /api/projects/:id/team
 * @access  Private
 */
export const getProjectTeam = async (req, res, next) => {
  try {
    const projectId = req.params.id;
    const project = await Project.findById(projectId)
      .populate("creator", "name email college branch year profilePicture");

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project listing not found",
      });
    }

    // Verify membership
    const isMember = await checkProjectMembership(projectId, req.user._id);
    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: "Access Denied: You are not authorized to view this team roster",
      });
    }

    const acceptedApps = await Application.find({
      project: projectId,
      status: "accepted",
    }).populate("applicant", "name email college branch year profilePicture");

    const members = [
      { ...project.creator.toObject(), role: "Creator" },
      ...acceptedApps
        .map((app) => {
          if (app.applicant) {
            return { ...app.applicant.toObject(), role: "Member" };
          }
          return null;
        })
        .filter(Boolean),
    ];

    return res.status(200).json({
      success: true,
      members,
    });
  } catch (error) {
    next(error);
  }
};
