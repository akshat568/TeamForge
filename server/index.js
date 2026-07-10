import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";

import connectDB from "./config/db.js";
import healthRoutes from "./routes/healthRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import http from "http";
import { initSocket } from "./socket.js";
import applicationRoutes from "./routes/applicationRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import resourceRoutes from "./routes/resourceRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import githubRoutes from "./routes/githubRoutes.js";
import attachmentRoutes from "./routes/attachmentRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import commentRoutes from "./routes/commentRoutes.js";
import sprintRoutes from "./routes/sprintRoutes.js";
import { initReminderJob } from "./services/reminderService.js";


console.log("✅ Attachment routes imported:", attachmentRoutes);
import { errorHandler, notFound } from "./middleware/errorHandler.js";

// ─── Connect to Database ─────────────────────────────────────────────────────
connectDB();

// ─── Initialize App ───────────────────────────────────────────────────────────
const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/resources", resourceRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/github", githubRoutes);
app.use("/api/attachments", attachmentRoutes);
app.use("/api/users", userRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/sprints", sprintRoutes);

// ─── Root Route ───────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to the TeamForge API",
    version: "1.0.0",
    docs: "/api/health",
  });
});

// ─── Error Handling ───────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Start Server (HTTP + Socket) ─────────────────────────────────────────────
const server = http.createServer(app);
initSocket(server);
initReminderJob();

server.listen(PORT, () => {
  console.log(
    `🚀 TeamForge server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`
  );
});
