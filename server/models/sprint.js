import mongoose from "mongoose";

const sprintSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: [true, "Project reference is required"],
      index: true,
    },
    name: {
      type: String,
      required: [true, "Sprint name is required"],
      trim: true,
    },
    goal: {
      type: String,
      trim: true,
      default: "",
    },
    startDate: {
      type: Date,
      required: [true, "Sprint start date is required"],
    },
    endDate: {
      type: Date,
      required: [true, "Sprint end date is required"],
    },
    status: {
      type: String,
      enum: ["planned", "active", "completed"],
      default: "planned",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

const Sprint = mongoose.model("Sprint", sprintSchema);

export default Sprint;
