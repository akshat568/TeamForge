import api from "./api";

/**
 * Fetch all resources links for a project workspace
 */
export const getProjectResources = async (projectId) => {
  const res = await api.get(`/resources/project/${projectId}`);
  return res.data;
};

/**
 * Upload/Add a resource link
 */
export const createResource = async (projectId, resourceData) => {
  const res = await api.post(`/resources/project/${projectId}`, resourceData);
  return res.data;
};

/**
 * Delete a resource link
 */
export const deleteResource = async (resourceId) => {
  const res = await api.delete(`/resources/${resourceId}`);
  return res.data;
};
