import api from "./api";

/**
 * Upload an attachment (document or task file)
 * Supports progress updates and cancellation abort signals.
 */
export const uploadAttachment = async (formData, onUploadProgress, signal) => {
  const res = await api.post("/attachments/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    onUploadProgress,
    signal,
  });
  return res.data;
};

/**
 * Fetch paginated project documents
 */
export const getProjectAttachments = async (projectId, page = 1, limit = 25) => {
  const res = await api.get(`/attachments/project/${projectId}?page=${page}&limit=${limit}`);
  return res.data;
};

/**
 * Fetch attachments associated with a specific task card
 */
export const getTaskAttachments = async (taskId) => {
  const res = await api.get(`/attachments/task/${taskId}`);
  return res.data;
};

/**
 * Delete a specific attachment file from storage and database
 */
export const deleteAttachment = async (attachmentId) => {
  const res = await api.delete(`/attachments/${attachmentId}`);
  return res.data;
};
