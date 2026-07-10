import api from "./api";

const sprintService = {
  getProjectSprints: (projectId) => api.get(`/sprints/project/${projectId}`),
  createSprint: (projectId, sprintData) => api.post(`/sprints/project/${projectId}`, sprintData),
  updateSprint: (sprintId, sprintData) => api.put(`/sprints/${sprintId}`, sprintData),
  deleteSprint: (sprintId) => api.delete(`/sprints/${sprintId}`)
};

export default sprintService;
