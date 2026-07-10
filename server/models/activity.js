import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
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
    action: {
      type: String,
      required: [true, "Action description is required"],
    },
    target: {
      type: String,
      required: [true, "Target description is required"],
    },
  },
  {
    timestamps: true,
  }
);

const Activity = mongoose.model("Activity", activitySchema);

export default Activity;
