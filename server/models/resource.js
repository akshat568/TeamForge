import mongoose from "mongoose";

const resourceSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: [true, "Project reference is required"],
      index: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Uploader reference is required"],
    },
    fileName: {
      type: String,
      required: [true, "File/Resource name is required"],
      trim: true,
    },
    fileUrl: {
      type: String,
      required: [true, "File/Resource URL link is required"],
      trim: true,
    },
    type: {
      type: String,
      default: "Link",
    },
  },
  {
    timestamps: true,
  }
);

const Resource = mongoose.model("Resource", resourceSchema);

export default Resource;
