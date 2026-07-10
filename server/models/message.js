import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Sender reference is required"],
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      // Optional: set for Direct Messages (DMs)
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      // Optional: set for Project team room group chats
    },
    content: {
      type: String,
      required: [true, "Message content is required"],
      trim: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes to speed up queries
messageSchema.index({ sender: 1, recipient: 1 });
messageSchema.index({ project: 1 });

const Message = mongoose.model("Message", messageSchema);

export default Message;
