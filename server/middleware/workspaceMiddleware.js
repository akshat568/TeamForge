import Project from "../models/project.js";
import Application from "../models/application.js";

/**
 * Middleware to verify that the logged-in user has workspace access for the specified project.
 * Allows access if user is creator or an accepted team member.
 */
export const verifyWorkspaceAccess = async (req, res, next) => {
  try {
    const projectId = req.params.projectId || req.body.projectId || req.query.projectId;
    const userId = req.user._id;

    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: "Project ID is required to verify workspace access",
      });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project workspace not found",
      });
    }

    // 1. Project Creator check
    if (project.creator.toString() === userId.toString()) {
      return next();
    }

    // 2. Accepted Application check
    const acceptedApp = await Application.findOne({
      project: projectId,
      applicant: userId,
      status: "accepted",
    });

    if (!acceptedApp) {
      return res.status(403).json({
        success: false,
        message: "Access Denied: You are not a member of this project workspace.",
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};
