import mongoose from "mongoose";

const roleSchema = new mongoose.Schema({
  roleName: {
    type: String,
    required: [true, "Role name is required"],
    trim: true,
  },
  vacancies: {
    type: Number,
    default: 1,
    min: [1, "Vacancies must be at least 1"],
  },
  status: {
    type: String,
    enum: ["open", "filled"],
    default: "open",
  },
});

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Project title is required"],
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, "Project description is required"],
      trim: true,
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Creator reference is required"],
    },
    category: {
      type: String,
      required: [true, "Project category is required"],
      enum: {
        values: ["Hackathon", "Startup", "Open Source", "Research", "Personal Project"],
        message: "{VALUE} is not a supported category",
      },
      index: true,
    },
    skillsRequired: {
      type: [String],
      required: [true, "Skills requirements are required"],
      index: true,
    },
    roles: [roleSchema],
    status: {
      type: String,
      enum: ["open", "full", "in-progress", "completed"],
      default: "open",
    },
    githubUrl: {
      type: String,
      default: "",
      trim: true,
      validate: {
        validator: function (v) {
          if (!v) return true; // optional
          // Validates github.com/username/reponame (with optional https and www)
          return /^(https?:\/\/)?(www\.)?github\.com\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+\/?$/.test(v);
        },
        message: (props) => `${props.value} is not a valid GitHub repository URL!`,
      },
    },
    githubRepository: {
      type: String,
      default: "",
      trim: true,
      validate: {
        validator: function (v) {
          if (!v) return true; // optional
          // Validates "owner/repo" structure
          return /^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+$/.test(v);
        },
        message: (props) => `${props.value} is not a valid GitHub repository path (owner/repo)!`,
      },
    },
    maxTeamSize: {
      type: Number,
      required: [true, "Maximum team size is required"],
      min: [1, "Maximum team size must be at least 1"],
      default: 10,
    },
    currentTeamSize: {
      type: Number,
      default: 1,
      min: [1, "Current team size must be at least 1"],
    },
  },
  {
    timestamps: true,
  }
);

// Create compound index for search matching (title, description, skillsRequired)
projectSchema.index({ title: "text", description: "text", skillsRequired: "text" });

const Project = mongoose.model("Project", projectSchema);

export default Project;
