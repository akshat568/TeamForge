import Notification from "../models/notification.js";
import Application from "../models/application.js";
import Project from "../models/project.js";
import { sendNotification } from "../socket.js";

/**
 * Centered Workspace Notification Service
 * Saves workspace notifications to MongoDB and broadcasts them via Socket.IO to users.
 */
export const createWorkspaceNotification = async ({
  projectId,
  senderId,
  type,
  title,
  message,
  metadata = {},
  excludeSender = true,
  forceRecipients = null,
}) => {
  try {
    let recipients = [];

    if (forceRecipients) {
      recipients = forceRecipients;
    } else if (projectId) {
      const project = await Project.findById(projectId);
      if (!project) return;

      const acceptedApps = await Application.find({ project: projectId, status: "accepted" });
      const allMembers = [project.creator.toString(), ...acceptedApps.map((a) => a.applicant.toString())];
      const uniqueMembers = [...new Set(allMembers)];

      recipients = excludeSender
        ? uniqueMembers.filter((id) => id !== senderId?.toString())
        : uniqueMembers;
    }

    for (const recipientId of recipients) {
      const notification = await Notification.create({
        project: projectId || null,
        sender: senderId || null,
        recipient: recipientId,
        type,
        title,
        message,
        content: message, // Backward compatibility content copy
        metadata: {
          ...metadata,
          projectId,
        },
        read: false,
      });

      const populatedNotify = await Notification.findById(notification._id)
        .populate("sender", "name profilePicture")
        .populate("project", "title")
        .lean();

      // Transmit Socket.IO event to recipient room
      sendNotification(recipientId, populatedNotify);
    }
  } catch (error) {
    console.error(`Error saving workspace notification of type ${type}:`, error.message);
  }
};
