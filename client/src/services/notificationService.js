import api from "./api";

/**
 * Fetch all notifications (paginated)
 */
export const getNotifications = async (page = 1, limit = 25) => {
  const res = await api.get(`/notifications?page=${page}&limit=${limit}`);
  return res.data;
};

/**
 * Fetch unread notifications (paginated)
 */
export const getUnreadNotifications = async (page = 1, limit = 25) => {
  const res = await api.get(`/notifications/unread?page=${page}&limit=${limit}`);
  return res.data;
};

/**
 * Fetch unread count
 */
export const getUnreadCount = async () => {
  const res = await api.get("/notifications/count");
  return res.data;
};

/**
 * Mark a specific notification as read
 */
export const markNotificationRead = async (id) => {
  const res = await api.patch(`/notifications/${id}/read`);
  return res.data;
};

/**
 * Mark all notifications as read
 */
export const markAllNotificationsRead = async () => {
  const res = await api.patch("/notifications/read-all");
  return res.data;
};

/**
 * Delete a specific notification
 */
export const deleteNotification = async (id) => {
  const res = await api.delete(`/notifications/${id}`);
  return res.data;
};

/**
 * Clear all read notifications
 */
export const deleteReadNotifications = async () => {
  const res = await api.delete("/notifications/read");
  return res.data;
};
