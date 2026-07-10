import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please use a valid email address"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
    },
    college: {
      type: String,
      required: [true, "College name is required"],
      trim: true,
    },
    year: {
      type: String,
      required: [true, "Year is required"],
      trim: true,
    },
    branch: {
      type: String,
      required: [true, "Branch/Field is required"],
      trim: true,
    },
    skills: {
      type: [String],
      default: [],
    },
    github: {
      type: String,
      default: "",
      trim: true,
    },
    linkedin: {
      type: String,
      default: "",
      trim: true,
    },
    bio: {
      type: String,
      default: "",
      trim: true,
    },
    profilePicture: {
      type: String,
      default: "",
    },
    resume: {
      type: String,
      default: "",
    },
    location: {
      type: String,
      default: "",
      trim: true,
    },
    portfolio: {
      type: String,
      default: "",
      trim: true,
    },
    leetcode: {
      type: String,
      default: "",
      trim: true,
    },
    codeforces: {
      type: String,
      default: "",
      trim: true,
    },
    codechef: {
      type: String,
      default: "",
      trim: true,
    },
    twitter: {
      type: String,
      default: "",
      trim: true,
    },
    website: {
      type: String,
      default: "",
      trim: true,
    },
    coverImage: {
      type: String,
      default: "",
    },
    experienceLevel: {
      type: String,
      default: "Beginner",
      trim: true,
    },
    interests: {
      type: [String],
      default: [],
    },
    preferredRoles: {
      type: [String],
      default: [],
    },
    availability: {
      type: String,
      default: "Available",
      trim: true,
    },
    passwordResetToken: {
      type: String,
    },
    passwordResetExpires: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// ─── Hash Password Before Saving ──────────────────────────────────────────────
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// ─── Compare Candidate Password ─────────────────────────────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;
