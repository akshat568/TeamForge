import mongoose from "mongoose";

const aiHistorySchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: [true, "Project reference is required"],
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
    },
    actionType: {
      type: String,
      required: [true, "AI action type is required"],
    },
    promptText: {
      type: String,
      required: [true, "Prompt text is required"],
    },
    responsePayload: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, "Response payload is required"],
    },
  },
  {
    timestamps: true,
  }
);

const AiHistory = mongoose.model("AiHistory", aiHistorySchema);

export default AiHistory;
