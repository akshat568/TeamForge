import api from "./api";

/**
 * Trigger AI task breakdown suggestions
 */
export const generateTasks = async (projectId, signal) => {
  const res = await api.post("/ai/generate-tasks", { projectId }, { signal });
  return res.data;
};

/**
 * Trigger AI progress summary status
 */
export const getProjectSummary = async (projectId, signal) => {
  const res = await api.post("/ai/project-summary", { projectId }, { signal });
  return res.data;
};

/**
 * Trigger AI sprint roadmap timeline
 */
export const getSprintPlan = async (projectId, signal) => {
  const res = await api.post("/ai/sprint-plan", { projectId }, { signal });
  return res.data;
};

/**
 * Trigger README.md generation
 */
export const getReadme = async (projectId, signal) => {
  const res = await api.post("/ai/readme", { projectId }, { signal });
  return res.data;
};

/**
 * Trigger developer documentation generation
 */
export const getDocumentation = async (projectId, signal) => {
  const res = await api.post("/ai/documentation", { projectId }, { signal });
  return res.data;
};

/**
 * Trigger daily standup analysis
 */
export const getDailyStandup = async (projectId, signal) => {
  const res = await api.post("/ai/daily-standup", { projectId }, { signal });
  return res.data;
};

/**
 * Trigger project health analysis
 */
export const getProjectHealth = async (projectId, signal) => {
  const res = await api.post("/ai/project-health", { projectId }, { signal });
  return res.data;
};

/**
 * Send conversational user message to the workspace AI chat
 */
export const chatWithAi = async (projectId, message, history = [], signal) => {
  const res = await api.post("/ai/chat", { projectId, message, history }, { signal });
  return res.data;
};

/**
 * Fetch AI generation history logs for this workspace
 */
export const getPromptHistory = async (projectId) => {
  const res = await api.get(`/ai/history/${projectId}`);
  return res.data;
};
