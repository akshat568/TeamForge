import User from "../models/user.js";
import Project from "../models/project.js";
import Application from "../models/application.js";
import Task from "../models/task.js";
import Attachment from "../models/attachment.js";
import Notification from "../models/notification.js";
import AiHistory from "../models/aiHistory.js";
import Activity from "../models/activity.js";
import cloudinary from "../config/cloudinary.js";

// Helper to stream upload buffers directly to Cloudinary
const uploadToCloudinary = (fileBuffer, folder) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image" },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    uploadStream.end(fileBuffer);
  });
};

/**
 * @desc    Get user profile & portfolio details
 * @route   GET /api/users/:id
 * @access  Public / Private
 */
export const getUserProfile = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Determine if requester is the user themselves
    const isMe = req.user && req.user._id.toString() === user._id.toString();

    // Prepare clean user details
    const cleanUser = user.toObject();
    delete cleanUser.password;
    delete cleanUser.passwordResetToken;
    delete cleanUser.passwordResetExpires;
    delete cleanUser.__v;

    // Filter private coordinates if it's a public view
    if (!isMe) {
      delete cleanUser.email;
      delete cleanUser.resume;
    }

    // Compute profile analytics
    const [
      projectsCreated,
      acceptedApps,
      tasksCompleted,
      documentsUploaded,
      notificationsReceived,
      aiRequests
    ] = await Promise.all([
      Project.countDocuments({ creator: user._id }),
      Application.find({ applicant: user._id, status: "accepted" }).select("project"),
      Task.countDocuments({ assignedTo: user._id, status: "Completed" }),
      Attachment.countDocuments({ uploadedBy: user._id }),
      Notification.countDocuments({ recipient: user._id }),
      AiHistory.countDocuments({ user: user._id })
    ]);

    const projectsJoined = acceptedApps.length;
    const githubConnected = !!user.github;

    return res.status(200).json({
      success: true,
      user: cleanUser,
      analytics: {
        projectsCreated,
        projectsJoined,
        tasksCompleted,
        documentsUploaded,
        notificationsReceived,
        aiRequests,
        githubConnected
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update user profile details
 * @route   PUT /api/users/profile
 * @access  Private
 */
export const updateUserProfile = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const fieldsToUpdate = [
      "name", "bio", "skills", "location", "portfolio", 
      "leetcode", "codeforces", "codechef", "twitter", "website",
      "experienceLevel", "interests", "preferredRoles", "availability",
      "college", "year", "branch"
    ];

    const updateData = {};
    fieldsToUpdate.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select("-password -passwordResetToken -passwordResetExpires -__v");

    return res.status(200).json({
      success: true,
      user: updatedUser
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Upload avatar picture
 * @route   PUT /api/users/avatar
 * @access  Private
 */
export const updateAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload an avatar image file."
      });
    }

    const result = await uploadToCloudinary(req.file.buffer, "TeamForge/users/avatars");
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { profilePicture: result.secure_url } },
      { new: true }
    ).select("-password -passwordResetToken -passwordResetExpires -__v");

    return res.status(200).json({
      success: true,
      user: updatedUser
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Upload cover photo
 * @route   PUT /api/users/cover
 * @access  Private
 */
export const updateCover = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload a cover image file."
      });
    }

    const result = await uploadToCloudinary(req.file.buffer, "TeamForge/users/covers");
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { coverImage: result.secure_url } },
      { new: true }
    ).select("-password -passwordResetToken -passwordResetExpires -__v");

    return res.status(200).json({
      success: true,
      user: updatedUser
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user's project listings
 * @route   GET /api/users/:id/projects
 * @access  Public
 */
export const getUserProjects = async (req, res, next) => {
  try {
    const { id } = req.params;
    const acceptedApps = await Application.find({ applicant: id, status: "accepted" }).select("project");
    const projectIds = acceptedApps.map(app => app.project);

    const projects = await Project.find({
      $or: [
        { creator: id },
        { _id: { $in: projectIds } }
      ]
    }).populate("creator", "name profilePicture");

    return res.status(200).json({
      success: true,
      projects
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user's activity timeline logs
 * @route   GET /api/users/:id/activity
 * @access  Public
 */
export const getUserActivity = async (req, res, next) => {
  try {
    const { id } = req.params;
    const activity = await Activity.find({ user: id })
      .populate("project", "title")
      .sort({ createdAt: -1 })
      .limit(30);

    return res.status(200).json({
      success: true,
      activity
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Search users by name, college, skills, branch
 * @route   GET /api/users/search
 * @access  Public
 */
export const searchUsers = async (req, res, next) => {
  try {
    const { q, name, college, skills, branch } = req.query;
    let query = {};

    if (q) {
      query.$or = [
        { name: { $regex: q, $options: "i" } },
        { college: { $regex: q, $options: "i" } },
        { branch: { $regex: q, $options: "i" } },
        { skills: { $in: [new RegExp(q, "i")] } }
      ];
    } else {
      if (name) query.name = { $regex: name, $options: "i" };
      if (college) query.college = { $regex: college, $options: "i" };
      if (branch) query.branch = { $regex: branch, $options: "i" };
      if (skills) {
        const skillsList = skills.split(",").map(s => s.trim());
        query.skills = { $in: skillsList.map(s => new RegExp(s, "i")) };
      }
    }

    const users = await User.find(query)
      .select("name college branch year skills profilePicture availability preferredRoles bio")
      .limit(50);

    return res.status(200).json({
      success: true,
      users
    });
  } catch (error) {
    next(error);
  }
};
