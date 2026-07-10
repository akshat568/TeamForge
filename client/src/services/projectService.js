import api from "./api";

/**
 * Create a new project listing
 */
export const createProject = async (projectData) => {
  const res = await api.post("/projects", projectData);
  return res.data;
};

/**
 * Retrieve all project listings with optional filters (search, category, skills)
 */
export const getProjects = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.search) params.append("search", filters.search);
  if (filters.category) params.append("category", filters.category);
  if (filters.skills) params.append("skills", filters.skills);

  const res = await api.get(`/projects?${params.toString()}`);
  return res.data;
};

/**
 * Retrieve a single project's details by ID
 */
export const getProjectById = async (id) => {
  const res = await api.get(`/projects/${id}`);
  return res.data;
};

/**
 * Update an existing project listing
 */
export const updateProject = async (id, projectData) => {
  const res = await api.put(`/projects/${id}`, projectData);
  return res.data;
};

/**
 * Delete a project listing
 */
export const deleteProject = async (id) => {
  const res = await api.delete(`/projects/${id}`);
  return res.data;
};

/**
 * Retrieve the current logged-in user's created projects
 */
export const getMyProjects = async () => {
  const res = await api.get("/projects/my-projects");
  return res.data;
};
