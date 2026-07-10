import { Server } from "socket.io";
import { protect } from "./middleware/authMiddleware.js";
import Project from "./models/project.js";
import Application from "./models/application.js";
import Message from "./models/message.js";

let io = null;

// Registry tracking socket associations
// Maps socket.id -> { projectId, userId }
const socketRegistry = new Map();

// Map tracking project workspaces presence states
// Maps projectId -> Map<userId, { userId, name, profilePicture, connectedAt, lastSeen, sockets: Set<string> }>
const presenceMap = new Map();

// Reusable project membership verification helper
export const checkProjectMembership = async (projectId, userId) => {
  try {
    const project = await Project.findById(projectId);
    if (!project) return false;
    if (project.creator.toString() === userId.toString()) return true;

    const acceptedApp = await Application.findOne({
      project: projectId,
      applicant: userId,
      status: "accepted",
    });
    return !!acceptedApp;
  } catch (error) {
    console.error("Error checking project membership:", error.message);
    return false;
  }
};

// Reusable DM eligibility verification helper
export const checkDMEligibility = async (user1Id, user2Id) => {
  try {
    // 1. Check if user2 is accepted in user1's projects
    const u1Projects = await Project.find({ creator: user1Id });
    const isU2Accepted = await Application.findOne({
      project: { $in: u1Projects.map((p) => p._id) },
      applicant: user2Id,
      status: "accepted",
    });
    if (isU2Accepted) return true;

    // 2. Check if user1 is accepted in user2's projects
    const u2Projects = await Project.find({ creator: user2Id });
    const isU1Accepted = await Application.findOne({
      project: { $in: u2Projects.map((p) => p._id) },
      applicant: user1Id,
      status: "accepted",
    });
    if (isU1Accepted) return true;

    // 3. Check if both are accepted in the same project
    const u1Apps = await Application.find({ applicant: user1Id, status: "accepted" });
    const isTeammates = await Application.findOne({
      project: { $in: u1Apps.map((a) => a.project) },
      applicant: user2Id,
      status: "accepted",
    });
    return !!isTeammates;
  } catch (error) {
    console.error("Error checking DM eligibility:", error.message);
    return false;
  }
};

// Helper function to manage user disconnection/room exits
const handleUserLeave = (socketId, projectId) => {
  const registration = socketRegistry.get(socketId);
  if (!registration) return;

  const { userId } = registration;
  socketRegistry.delete(socketId);

  const projectPresence = presenceMap.get(projectId);
  if (projectPresence) {
    const userPresence = projectPresence.get(userId);
    if (userPresence) {
      userPresence.sockets.delete(socketId);

      // Transition user to offline ONLY when all active tabs/sockets disconnect
      if (userPresence.sockets.size === 0) {
        userPresence.connectedAt = null;
        userPresence.lastSeen = new Date();

        // Broadcast offline indicator + lastSeen timestamp to project room members
        if (io) {
          io.to(`project_${projectId}`).emit("user_offline", {
            userId,
            lastSeen: userPresence.lastSeen,
          });
        }
      }
    }
  }
};

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      credentials: true,
    },
  });

  // Reuse express auth middleware to authorize socket connections
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;

    const authHeader = token
      ? `Bearer ${token}`
      : socket.handshake.headers?.authorization;
    if (!authHeader) {
      return next(new Error("Authentication error: No authorization token provided"));
    }

    const req = { headers: { authorization: authHeader } };
    const res = {
      status: () => ({
        json: (data) => next(new Error(data.message || "Unauthorized socket access")),
      }),
    };

    protect(req, res, () => {
      if (req.user) {
        socket.user = req.user;
        next();
      } else {
        next(new Error("Authentication error: User not attached to request"));
      }
    });
  });

  io.on("connection", (socket) => {
    console.log(`🔌 Socket connected: ${socket.user.name} (${socket.id})`);

    // Join user's private notification and DM room
    socket.join(`user_${socket.user._id}`);

    // Join project team chat room
    socket.on("join_project_room", async ({ projectId }) => {
      const isMember = await checkProjectMembership(projectId, socket.user._id);
      if (isMember) {
        socket.join(`project_${projectId}`);

        // Initialize presence lists for workspace project
        if (!presenceMap.has(projectId)) {
          presenceMap.set(projectId, new Map());
        }
        const projectPresence = presenceMap.get(projectId);
        const userIdStr = socket.user._id.toString();

        let userPresence = projectPresence.get(userIdStr);
        let isNewOnline = false;

        if (!userPresence) {
          userPresence = {
            userId: userIdStr,
            name: socket.user.name,
            profilePicture: socket.user.profilePicture || "",
            connectedAt: new Date(),
            lastSeen: null,
            sockets: new Set(),
          };
          projectPresence.set(userIdStr, userPresence);
          isNewOnline = true;
        } else if (!userPresence.connectedAt) {
          // Returning online from offline status state
          userPresence.connectedAt = new Date();
          userPresence.lastSeen = null;
          isNewOnline = true;
        }

        userPresence.sockets.add(socket.id);
        socketRegistry.set(socket.id, { projectId, userId: userIdStr });

        // Emit online_members list back to newly connected client
        const membersList = Array.from(projectPresence.values()).map((u) => ({
          userId: u.userId,
          name: u.name,
          profilePicture: u.profilePicture,
          connectedAt: u.connectedAt,
          lastSeen: u.lastSeen,
        }));
        socket.emit("online_members", membersList);

        // Broadcast user_online to other workspace participants
        if (isNewOnline) {
          socket.to(`project_${projectId}`).emit("user_online", {
            userId: userIdStr,
            name: socket.user.name,
            profilePicture: socket.user.profilePicture || "",
            connectedAt: userPresence.connectedAt,
          });
        }

        console.log(`👥 Socket ${socket.user.name} joined project room: ${projectId}`);
        socket.emit("project_room_joined", { success: true, projectId });
      } else {
        console.warn(`⚠️ Unauthorized attempt to join project room ${projectId} by ${socket.user.name}`);
        socket.emit("error", { message: "Not authorized to access this team chat room" });
      }
    });

    // Leave project team chat room
    socket.on("leave_project_room", ({ projectId }) => {
      socket.leave(`project_${projectId}`);
      handleUserLeave(socket.id, projectId);
      console.log(`👥 Socket ${socket.user.name} left project room: ${projectId}`);
    });

    // Handle Direct Message (DM) sending
    socket.on("send_dm", async ({ recipientId, content }) => {
      try {
        const senderId = socket.user._id;

        // Verify eligibility before processing DM
        const isEligible = await checkDMEligibility(senderId, recipientId);
        if (!isEligible) {
          return socket.emit("error", { message: "Messaging is restricted to teammates only" });
        }

        if (!content || !content.trim()) {
          return socket.emit("error", { message: "Message content cannot be empty" });
        }

        // Save message to DB
        const message = await Message.create({
          sender: senderId,
          recipient: recipientId,
          content: content.trim(),
        });

        // Populate sender info
        const populatedMessage = await Message.findById(message._id).populate(
          "sender",
          "name profilePicture"
        );

        // Emit to recipient room and sender room
        io.to(`user_${recipientId}`).emit("dm_received", populatedMessage);
        io.to(`user_${senderId}`).emit("dm_received", populatedMessage);
      } catch (err) {
        console.error("Error processing send_dm event:", err.message);
        socket.emit("error", { message: "Failed to transmit message" });
      }
    });

    // Handle Project Group Message sending
    socket.on("send_project_message", async ({ projectId, content }) => {
      try {
        const senderId = socket.user._id;

        // Verify membership before processing group message
        const isMember = await checkProjectMembership(projectId, senderId);
        if (!isMember) {
          return socket.emit("error", { message: "You are not a member of this project team" });
        }

        if (!content || !content.trim()) {
          return socket.emit("error", { message: "Message content cannot be empty" });
        }

        // Save message to DB
        const message = await Message.create({
          sender: senderId,
          project: projectId,
          content: content.trim(),
        });

        // Populate sender info
        const populatedMessage = await Message.findById(message._id).populate(
          "sender",
          "name profilePicture"
        );

        // Broadcast message to project room
        io.to(`project_${projectId}`).emit("message_received", populatedMessage);
      } catch (err) {
        console.error("Error processing send_project_message event:", err.message);
        socket.emit("error", { message: "Failed to transmit message" });
      }
    });

    socket.on("disconnect", () => {
      const registration = socketRegistry.get(socket.id);
      if (registration) {
        handleUserLeave(socket.id, registration.projectId);
      }
      console.log(`🔌 Socket disconnected: ${socket.user.name} (${socket.id})`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    console.warn("Socket.io has not been initialized!");
  }
  return io;
};

// Global helper to send real-time notifications to users
export const sendNotification = (userId, notificationData) => {
  if (io) {
    io.to(`user_${userId}`).emit("notification_received", notificationData);
  }
};

// Global helper to send real-time DMs to users
export const sendDM = (recipientId, messageData) => {
  if (io) {
    io.to(`user_${recipientId}`).emit("dm_received", messageData);
  }
};

// Global helper to send project group message
export const sendProjectMessage = (projectId, messageData) => {
  if (io) {
    io.to(`project_${projectId}`).emit("message_received", messageData);
  }
};
