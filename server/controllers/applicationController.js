import mongoose from "mongoose";
import Application from "../models/application.js";
import Project from "../models/project.js";
import Notification from "../models/notification.js";
import User from "../models/user.js";
import { sendNotification } from "../socket.js";
import { createWorkspaceNotification } from "../services/notificationService.js";

/**
 * @desc    Submit an application to a project
 * @route   POST /api/applications
 * @access  Private
 */
export const createApplication = async (req, res, next) => {
  try {
    const { projectId, roleId, introduction, whyJoin, skills, githubUrl } = req.body;

    // 1. Validate fields
    if (!projectId || !roleId || !introduction || !whyJoin || !skills) {
      return res.status(400).json({
        success: false,
        message: "Please enter all required fields",
      });
    }

    // 2. Fetch project
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project listing not found",
      });
    }

    // 3. Prevent creators applying to their own projects
    if (project.creator.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot apply to your own project listing",
      });
    }

    // 4. Check if project is already full
    if (project.status === "full" || project.currentTeamSize >= project.maxTeamSize) {
      return res.status(400).json({
        success: false,
        message: "This project has already reached its maximum team size",
      });
    }

    // 5. Check if target role exists and has spots
    const targetRole = project.roles.id(roleId);
    if (!targetRole) {
      return res.status(404).json({
        success: false,
        message: "Target vacancy role not found in this project",
      });
    }

    if (targetRole.status === "filled" || targetRole.vacancies < 1) {
      return res.status(400).json({
        success: false,
        message: "This specific role vacancy has already been filled",
      });
    }

    // 6. Check for duplicate applications
    const duplicateApp = await Application.findOne({
      project: projectId,
      applicant: req.user._id,
    });
    if (duplicateApp) {
      return res.status(400).json({
        success: false,
        message: "You have already submitted an application to this project",
      });
    }

    // 7. Save application
    const application = new Application({
      project: projectId,
      applicant: req.user._id,
      roleId,
      introduction,
      whyJoin,
      skills: typeof skills === "string" ? skills.split(",").map((s) => s.trim()) : skills,
      githubUrl: githubUrl || "",
    });

    const savedApp = await application.save();

    // 8. Create real-time notification for the project creator
    try {
      const notify = await Notification.create({
        recipient: project.creator,
        sender: req.user._id,
        type: "application_submitted",
        project: project._id,
        application: savedApp._id,
        content: `${req.user.name} submitted an application for your project: "${project.title}"`,
      });

      const populatedNotify = await Notification.findById(notify._id)
        .populate("sender", "name profilePicture")
        .populate("project", "title");

      sendNotification(project.creator.toString(), populatedNotify);
    } catch (err) {
      console.error("Failed to generate application notification:", err.message);
    }

    return res.status(201).json({
      success: true,
      application: savedApp,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user's submitted applications
 * @route   GET /api/applications/my-applications
 * @access  Private
 */
export const getMyApplications = async (req, res, next) => {
  try {
    const applications = await Application.find({ applicant: req.user._id })
      .populate({
        path: "project",
        select: "title category status creator currentTeamSize maxTeamSize roles",
        populate: {
          path: "creator",
          select: "name college",
        },
      })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: applications.length,
      applications,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get applications for a specific project listing (Creator view)
 * @route   GET /api/applications/project/:projectId
 * @access  Private
 */
export const getProjectApplications = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project listing not found",
      });
    }

    // Auth check: only the project creator can view applications
    if (project.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view applications for this project",
      });
    }

    const applications = await Application.find({ project: req.params.projectId })
      .populate("applicant", "name email college year branch bio profilePicture skills github linkedin")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: applications.length,
      project,
      applications,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Accept or Reject a project application
 * @route   PUT /api/applications/:id/status
 * @access  Private
 */
export const updateApplicationStatus = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    const { status } = req.body;
    const applicationId = req.params.id;

    if (!["accepted", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Please specify a valid status (accepted or rejected)",
      });
    }

    // Start Transaction to ensure consistency
    session.startTransaction();

    const application = await Application.findById(applicationId).session(session);
    if (!application) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    if (application.status !== "pending") {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: "This application has already been processed",
      });
    }

    // Fetch project
    const project = await Project.findById(application.project).session(session);
    if (!project) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: "Associated project listing not found",
      });
    }

    // Auth check: only project creator can accept/reject applications
    if (project.creator.toString() !== req.user._id.toString()) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({
        success: false,
        message: "Not authorized to process this application",
      });
    }

    // Pre-calculate lists of user IDs that will be auto-rejected in this transaction
    let rejectedApplicantIds = [];

    // If Accept action
    if (status === "accepted") {
      // 1. Verify project is not already full
      if (project.status === "full" || project.currentTeamSize >= project.maxTeamSize) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          success: false,
          message: "Cannot accept applicant. Project has reached maximum capacity.",
        });
      }

      // 2. Verify target role has vacancies
      const targetRole = project.roles.id(application.roleId);
      if (!targetRole) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({
          success: false,
          message: "Target vacancy role not found in this project",
        });
      }

      if (targetRole.status === "filled" || targetRole.vacancies < 1) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          success: false,
          message: "This role has already been filled.",
        });
      }

      // Identify auto-reject candidate IDs
      const willRoleBeFull = targetRole.vacancies - 1 === 0;
      const willTeamBeFull = project.currentTeamSize + 1 >= project.maxTeamSize;

      let rejectQuery = {
        project: project._id,
        status: "pending",
        _id: { $ne: application._id },
      };

      if (willRoleBeFull && !willTeamBeFull) {
        rejectQuery.roleId = application.roleId;
      }

      if (willRoleBeFull || willTeamBeFull) {
        const appsToReject = await Application.find(rejectQuery).session(session);
        rejectedApplicantIds = appsToReject.map((a) => a.applicant.toString());
      }

      // 3. Update application status
      application.status = "accepted";
      await application.save({ session });

      // 4. Update role spots
      targetRole.vacancies -= 1;
      if (targetRole.vacancies === 0) {
        targetRole.status = "filled";
        
        // Auto-Reject other pending applications targeting this specific role
        await Application.updateMany(
          {
            project: project._id,
            roleId: application.roleId,
            status: "pending",
            _id: { $ne: application._id },
          },
          { $set: { status: "rejected" } },
          { session }
        );
      }

      // 5. Update team sizes
      project.currentTeamSize += 1;
      if (project.currentTeamSize >= project.maxTeamSize) {
        project.status = "full";

        // Auto-Reject ALL other pending applications for this project
        await Application.updateMany(
          {
            project: project._id,
            status: "pending",
            _id: { $ne: application._id },
          },
          { $set: { status: "rejected" } },
          { session }
        );
      }

      await project.save({ session });

      // 6. Save accept notification
      await Notification.create(
        [
          {
            recipient: application.applicant,
            sender: req.user._id,
            type: "application_accepted",
            project: project._id,
            application: application._id,
            content: `Your application to join "${project.title}" has been ACCEPTED!`,
          },
        ],
        { session }
      );

      // Save auto-reject notifications
      if (rejectedApplicantIds.length > 0) {
        const rejectNotifications = rejectedApplicantIds.map((appId) => ({
          recipient: appId,
          sender: req.user._id,
          type: "application_rejected",
          project: project._id,
          content: `Your application to join "${project.title}" was not selected. Keep looking!`,
        }));
        await Notification.create(rejectNotifications, { session });
      }
    } else {
      // If Reject action
      application.status = "rejected";
      await application.save({ session });

      // Save single reject notification
      await Notification.create(
        [
          {
            recipient: application.applicant,
            sender: req.user._id,
            type: "application_rejected",
            project: project._id,
            application: application._id,
            content: `Your application to join "${project.title}" has been rejected.`,
          },
        ],
        { session }
      );
    }

    await session.commitTransaction();
    session.endSession();

    // ─── SEND REAL-TIME NOTIFICATIONS OUTSIDE THE TRANSACTION ─────────────────
    try {
      if (status === "accepted") {
        const popAccept = await Notification.findOne({
          recipient: application.applicant,
          project: project._id,
          type: "application_accepted",
        })
          .populate("sender", "name profilePicture")
          .populate("project", "title");
        if (popAccept) {
          sendNotification(application.applicant.toString(), popAccept);
        }

        // Centralized member_joined notification trigger
        const applicantUser = await User.findById(application.applicant);
        if (applicantUser) {
          await createWorkspaceNotification({
            projectId: project._id,
            senderId: application.applicant,
            type: "member_joined",
            title: "New Member Joined Workspace",
            message: `${applicantUser.name} joined the project workspace.`,
            metadata: { projectId: project._id },
            excludeSender: true,
          });
        }

        for (const rejectId of rejectedApplicantIds) {
          const popReject = await Notification.findOne({
            recipient: rejectId,
            project: project._id,
            type: "application_rejected",
          })
            .populate("sender", "name profilePicture")
            .populate("project", "title")
            .sort({ createdAt: -1 });
          if (popReject) {
            sendNotification(rejectId, popReject);
          }
        }
      } else {
        const popReject = await Notification.findOne({
          recipient: application.applicant,
          project: project._id,
          type: "application_rejected",
        })
          .populate("sender", "name profilePicture")
          .populate("project", "title");
        if (popReject) {
          sendNotification(application.applicant.toString(), popReject);
        }
      }
    } catch (err) {
      console.error("Real-time notification dispatch failed:", err.message);
    }

    return res.status(200).json({
      success: true,
      message: `Application has been successfully ${status}`,
      application,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};
