import Task from "../models/task.js";
import { getIO } from "../socket.js";
import { createWorkspaceNotification } from "./notificationService.js";

export const checkDeadlines = async () => {
  try {
    const now = Date.now();
    // Find all uncompleted tasks with due dates
    const tasks = await Task.find({
      status: { $ne: "Completed" },
      dueDate: { $exists: true, $ne: null }
    });

    const io = getIO();

    for (const task of tasks) {
      if (!task.assignedTo) continue;

      const assigneeId = task.assignedTo.toString();
      const diffMs = task.dueDate.getTime() - now;
      const oneHour = 60 * 60 * 1000;
      const twentyFourHours = 24 * oneHour;

      let taskChanged = false;

      // 1. Overdue reminder
      if (diffMs <= 0) {
        if (!task.reminderSentOverdue) {
          task.reminderSentOverdue = true;
          taskChanged = true;

          // Create notification
          await createWorkspaceNotification({
            projectId: task.project,
            senderId: task.createdBy,
            type: "task_updated",
            title: "Task Overdue Warning",
            message: `Task is overdue: "${task.title}"`,
            metadata: { taskId: task._id },
            forceRecipients: [assigneeId]
          });

          // Socket emit
          if (io) {
            io.to(`user_${assigneeId}`).emit("task_overdue", {
              taskId: task._id,
              title: task.title,
              message: "This task is past its due date!"
            });
          }
        }
      } 
      // 2. 1 hour remaining reminder
      else if (diffMs <= oneHour) {
        if (!task.reminderSent1h) {
          task.reminderSent1h = true;
          taskChanged = true;

          await createWorkspaceNotification({
            projectId: task.project,
            senderId: task.createdBy,
            type: "task_updated",
            title: "Task Due Soon (1 Hour)",
            message: `Task "${task.title}" is due in less than 1 hour!`,
            metadata: { taskId: task._id },
            forceRecipients: [assigneeId]
          });

          if (io) {
            io.to(`user_${assigneeId}`).emit("deadline_reminder", {
              taskId: task._id,
              title: task.title,
              message: "Due in less than 1 hour!"
            });
          }
        }
      } 
      // 3. 24 hours remaining reminder
      else if (diffMs <= twentyFourHours) {
        if (!task.reminderSent24h) {
          task.reminderSent24h = true;
          taskChanged = true;

          await createWorkspaceNotification({
            projectId: task.project,
            senderId: task.createdBy,
            type: "task_updated",
            title: "Task Due in 24 Hours",
            message: `Task "${task.title}" is due in 24 hours.`,
            metadata: { taskId: task._id },
            forceRecipients: [assigneeId]
          });

          if (io) {
            io.to(`user_${assigneeId}`).emit("deadline_reminder", {
              taskId: task._id,
              title: task.title,
              message: "Due in 24 hours."
            });
          }
        }
      }

      if (taskChanged) {
        await task.save();
      }
    }
  } catch (error) {
    console.error("Error executing checkDeadlines reminder service:", error.message);
  }
};

// Start periodic checker (every 5 minutes)
export const initReminderJob = () => {
  console.log("⏰ Task deadlines reminder job initialized.");
  // Run once immediately on start
  setTimeout(checkDeadlines, 5000);
  
  // Run every 5 minutes
  setInterval(checkDeadlines, 5 * 60 * 1000);
};
