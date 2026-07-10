import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Recipient reference is required"],
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    type: {
      type: String,
      required: [true, "Notification type is required"],
      enum: {
        values: [
          "application_submitted",
          "application_accepted",
          "application_rejected",
          "chat_message",
          "document_uploaded",
          "document_deleted",
          "task_created",
          "task_updated",
          "task_completed",
          "task_deleted",
          "task_assigned",
          "resource_uploaded",
          "resource_deleted",
          "github_connected",
          "member_joined",
          "member_left",
          "workspace_created",
          "comment_added"
        ],
        message: "{VALUE} is not a valid notification type",
      },
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      index: true,
    },
    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Application",
    },
    title: {
      type: String,
      trim: true,
    },
    message: {
      type: String,
      trim: true,
    },
    content: {
      type: String,
      required: [true, "Notification content is required"],
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for pagination and unread count filtering
notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
