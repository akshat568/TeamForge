import api from "./api";

const commentService = {
  getTaskComments: (taskId) => api.get(`/comments/task/${taskId}`),
  createComment: (taskId, message) => api.post(`/comments/task/${taskId}`, { message }),
  updateComment: (commentId, message) => api.put(`/comments/${commentId}`, { message }),
  deleteComment: (commentId) => api.delete(`/comments/${commentId}`)
};

export default commentService;
