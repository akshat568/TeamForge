import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: [true, "Project reference is required"],
      index: true,
    },
    title: {
      type: String,
      required: [true, "Task title is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Created by user reference is required"],
    },
    priority: {
      type: String,
      enum: {
        values: ["Low", "Medium", "High"],
        message: "{VALUE} is not a valid priority",
      },
      default: "Medium",
    },
    status: {
      type: String,
      enum: {
        values: ["Todo", "In Progress", "Completed"],
        message: "{VALUE} is not a valid status",
      },
      default: "Todo",
      index: true,
    },
    dueDate: {
      type: Date,
    },
    startDate: {
      type: Date,
    },
    sprint: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Sprint",
      default: null,
      index: true,
    },
    reminderSent24h: {
      type: Boolean,
      default: false,
    },
    reminderSent1h: {
      type: Boolean,
      default: false,
    },
    reminderSentOverdue: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Task = mongoose.model("Task", taskSchema);

export default Task;
