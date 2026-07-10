import Message from "../models/message.js";
import User from "../models/user.js";
import Project from "../models/project.js";
import Application from "../models/application.js";
import { checkProjectMembership, checkDMEligibility } from "../socket.js";

/**
 * @desc    Get all active conversations (DMs and project group chats)
 * @route   GET /api/chat/conversations
 * @access  Private
 */
export const getConversations = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // ─── 1. FETCH DIRECT MESSAGE CONVERSATIONS ────────────────────────────────
    const dms = await Message.find({
      $or: [
        { sender: userId, recipient: { $exists: true } },
        { recipient: userId },
      ],
    }).sort({ createdAt: -1 });

    const partnersMap = new Map();
    for (const msg of dms) {
      const partnerId =
        msg.sender.toString() === userId.toString()
          ? msg.recipient.toString()
          : msg.sender.toString();
      if (!partnersMap.has(partnerId)) {
        partnersMap.set(partnerId, msg);
      }
    }

    const partnerUsers = await User.find({
      _id: { $in: Array.from(partnersMap.keys()) },
    }).select("name college year branch profilePicture");

    const directConversations = partnerUsers.map((partner) => {
      const lastMsg = partnersMap.get(partner._id.toString());
      return {
        type: "direct",
        partner: {
          id: partner._id,
          name: partner.name,
          college: partner.college,
          year: partner.year,
          branch: partner.branch,
          profilePicture: partner.profilePicture,
        },
        lastMessage: lastMsg.content,
        lastMessageTime: lastMsg.createdAt,
      };
    });

    // ─── 2. FETCH PROJECT TEAM GROUP CHATS ────────────────────────────────────
    // Find projects created by user
    const createdProjects = await Project.find({ creator: userId });
    
    // Find projects where user has accepted membership applications
    const acceptedApps = await Application.find({
      applicant: userId,
      status: "accepted",
    }).populate("project");
    
    const joinedProjects = acceptedApps.map((app) => app.project).filter(Boolean);

    // De-duplicate projects
    const allProjectsMap = new Map();
    createdProjects.forEach((p) => allProjectsMap.set(p._id.toString(), p));
    joinedProjects.forEach((p) => allProjectsMap.set(p._id.toString(), p));
    const allProjects = Array.from(allProjectsMap.values());

    const groupConversations = await Promise.all(
      allProjects.map(async (project) => {
        const lastMsg = await Message.findOne({ project: project._id })
          .sort({ createdAt: -1 });
        return {
          type: "project",
          project: {
            id: project._id,
            title: project.title,
            category: project.category,
            status: project.status,
          },
          lastMessage: lastMsg ? lastMsg.content : "No messages yet",
          lastMessageTime: lastMsg ? lastMsg.createdAt : project.createdAt,
        };
      })
    );

    // ─── 3. COMBINE AND SORT ──────────────────────────────────────────────────
    const conversations = [...directConversations, ...groupConversations].sort(
      (a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime)
    );

    return res.status(200).json({
      success: true,
      count: conversations.length,
      conversations,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get direct message history with a specific user
 * @route   GET /api/chat/user/:userId
 * @access  Private
 */
export const getDirectMessages = async (req, res, next) => {
  try {
    const senderId = req.user._id;
    const recipientId = req.params.userId;

    // Verify DM eligibility first
    const isEligible = await checkDMEligibility(senderId, recipientId);
    if (!isEligible) {
      return res.status(403).json({
        success: false,
        message: "You are only allowed to message team members or project creators",
      });
    }

    const messages = await Message.find({
      $or: [
        { sender: senderId, recipient: recipientId },
        { sender: recipientId, recipient: senderId },
      ],
    })
      .sort({ createdAt: 1 })
      .populate("sender", "name profilePicture");

    return res.status(200).json({
      success: true,
      count: messages.length,
      messages,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get group chat history for a project
 * @route   GET /api/chat/project/:projectId
 * @access  Private
 */
export const getProjectMessages = async (req, res, next) => {
  try {
    const projectId = req.params.projectId;
    const userId = req.user._id;

    // Verify project membership first
    const isMember = await checkProjectMembership(projectId, userId);
    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to read messages for this project team",
      });
    }

    const messages = await Message.find({ project: projectId })
      .sort({ createdAt: 1 })
      .populate("sender", "name profilePicture");

    return res.status(200).json({
      success: true,
      count: messages.length,
      messages,
    });
  } catch (error) {
    next(error);
  }
};
