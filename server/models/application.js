import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: [true, "Project reference is required"],
    },
    applicant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Applicant reference is required"],
    },
    roleId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Target role identifier is required"],
    },
    introduction: {
      type: String,
      required: [true, "Short introduction is required"],
      trim: true,
      maxlength: [300, "Introduction cannot exceed 300 characters"],
    },
    whyJoin: {
      type: String,
      required: [true, "Explanation of why you want to join is required"],
      trim: true,
      maxlength: [500, "Explanation cannot exceed 500 characters"],
    },
    skills: {
      type: [String],
      required: [true, "Relevant skills are required"],
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length > 0;
        },
        message: "Please list at least one relevant skill",
      },
    },
    githubUrl: {
      type: String,
      default: "",
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

// Enforce unique application per student per project
applicationSchema.index({ project: 1, applicant: 1 }, { unique: true });

const Application = mongoose.model("Application", applicationSchema);

export default Application;
