import api from "./api";

/**
 * Submit a join team application to a project
 */
export const applyToProject = async (applicationData) => {
  const res = await api.post("/applications", applicationData);
  return res.data;
};

/**
 * Fetch applications submitted by the current user
 */
export const getMyApplications = async () => {
  const res = await api.get("/applications/my-applications");
  return res.data;
};

/**
 * Fetch incoming applications for a specific project listing (Creator View)
 */
export const getProjectApplications = async (projectId) => {
  const res = await api.get(`/applications/project/${projectId}`);
  return res.data;
};

/**
 * Update application status (accept/reject)
 */
export const updateApplicationStatus = async (id, status) => {
  const res = await api.put(`/applications/${id}/status`, { status });
  return res.data;
};
