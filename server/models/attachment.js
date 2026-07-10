import mongoose from "mongoose";

const attachmentSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: [true, "Project reference is required"],
      index: true,
    },
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      default: null,
      index: true,
    },
    fileName: {
      type: String,
      required: [true, "File name is required"],
      trim: true,
    },
    originalName: {
      type: String,
      required: [true, "Original name is required"],
    },
    fileUrl: {
      type: String,
      required: [true, "File URL is required"],
    },
    publicId: {
      type: String,
      required: [true, "Cloudinary Public ID is required"],
    },
    mimeType: {
      type: String,
      required: [true, "MIME type is required"],
    },
    fileType: {
      type: String,
      required: [true, "File type is required"], // e.g. "image", "pdf", "word", "excel", "powerpoint", "archive", "text", "other"
    },
    fileSize: {
      type: Number,
      required: [true, "File size is required"],
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Uploader reference is required"],
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for duplicate prevention
attachmentSchema.index({ project: 1, task: 1, originalName: 1, fileSize: 1 });

const Attachment = mongoose.model("Attachment", attachmentSchema);
export default Attachment;
