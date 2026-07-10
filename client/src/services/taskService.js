import api from "./api";

/**
 * Fetch all tasks and activities for a project workspace
 */
export const getProjectTasks = async (projectId) => {
  const res = await api.get(`/tasks/project/${projectId}`);
  return res.data;
};

/**
 * Create a new task in a project workspace
 */
export const createTask = async (projectId, taskData) => {
  const res = await api.post(`/tasks/project/${projectId}`, taskData);
  return res.data;
};

/**
 * Update task details
 */
export const updateTask = async (taskId, taskData) => {
  const res = await api.put(`/tasks/${taskId}`, taskData);
  return res.data;
};

/**
 * Delete a task
 */
export const deleteTask = async (taskId) => {
  const res = await api.delete(`/tasks/${taskId}`);
  return res.data;
};

/**
 * Update only task status column
 */
export const updateTaskStatus = async (taskId, status) => {
  const res = await api.patch(`/tasks/${taskId}/status`, { status });
  return res.data;
};
