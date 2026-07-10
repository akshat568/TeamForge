import api from "./api";

/**
 * Fetch GitHub repository metadata and languages breakdown
 */
export const getRepositoryInfo = async (projectId) => {
  const res = await api.get(`/github/repository/${projectId}`);
  return res.data;
};

/**
 * Fetch latest commits
 */
export const getCommitsList = async (projectId) => {
  const res = await api.get(`/github/commits/${projectId}`);
  return res.data;
};

/**
 * Fetch contributor statistics
 */
export const getContributorsList = async (projectId) => {
  const res = await api.get(`/github/contributors/${projectId}`);
  return res.data;
};

/**
 * Fetch open issues list
 */
export const getIssuesList = async (projectId) => {
  const res = await api.get(`/github/issues/${projectId}`);
  return res.data;
};

/**
 * Fetch open pull requests list
 */
export const getPullRequestsList = async (projectId) => {
  const res = await api.get(`/github/pulls/${projectId}`);
  return res.data;
};
