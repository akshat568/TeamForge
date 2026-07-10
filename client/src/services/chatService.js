import api from "./api";

/**
 * Fetch list of active conversations (DMs and project group rooms)
 */
export const getConversations = async () => {
  const res = await api.get("/chat/conversations");
  return res.data;
};

/**
 * Fetch DM message logs with a specific user
 */
export const getDirectMessages = async (userId) => {
  const res = await api.get(`/chat/user/${userId}`);
  return res.data;
};

/**
 * Fetch project team group message logs
 */
export const getProjectMessages = async (projectId) => {
  const res = await api.get(`/chat/project/${projectId}`);
  return res.data;
};
