import multer from "multer";

const storage = multer.memoryStorage();

const allowedExtensions = [
  "jpg", "jpeg", "png", "gif", "webp",
  "pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx", "txt",
  "zip", "rar"
];

const fileFilter = (req, file, cb) => {
  const ext = file.originalname.split(".").pop().toLowerCase();
  if (!allowedExtensions.includes(ext)) {
    return cb(new Error("Unsupported file type. Allowed: Images, PDF, Office documents, TXT, ZIP, and RAR."));
  }
  cb(null, true);
};

export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10 MB limit
  },
  fileFilter
});
