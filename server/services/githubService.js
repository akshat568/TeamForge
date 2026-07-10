const cache = new Map();
const CACHE_TTL = 60000; // 60 seconds

/**
 * Retrieve cached item if valid and not expired
 */
const getCachedData = (key) => {
  const item = cache.get(key);
  if (item && item.expiresAt > Date.now()) {
    console.log(`[Cache Hit] Key: ${key}`);
    return item.data;
  }
  return null;
};

/**
 * Store data inside cache with 60s TTL expiration
 */
const setCachedData = (key, data) => {
  cache.set(key, {
    data,
    expiresAt: Date.now() + CACHE_TTL,
  });
};

/**
 * Reusable helper coordinating native fetch calls to GitHub endpoints
 */
const githubFetch = async (path, owner, repo) => {
  const cacheKey = `${owner}/${repo}:${path || "root"}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  const url = path 
    ? `https://api.github.com/repos/${owner}/${repo}/${path}` 
    : `https://api.github.com/repos/${owner}/${repo}`;

  const headers = {
    "User-Agent": "TeamForge-App",
    "Accept": "application/vnd.github.v3+json",
  };

  // If environment provides GITHUB_TOKEN, utilize it to increase API rate limit quotas
  if (process.env.GITHUB_TOKEN) {
    headers["Authorization"] = `token ${process.env.GITHUB_TOKEN}`;
  }

  try {
    const response = await fetch(url, { headers });

    if (response.status === 404) {
      throw new Error("GitHub repository not found. Please verify the owner and name format.");
    }

    if (response.status === 403) {
      const rateLimitRemaining = response.headers.get("x-ratelimit-remaining");
      if (rateLimitRemaining === "0") {
        throw new Error("GitHub API rate limit exceeded. Please try again in a few minutes.");
      }
      throw new Error("Access forbidden by GitHub API.");
    }

    if (!response.ok) {
      throw new Error(`GitHub API returned status ${response.status}`);
    }

    const data = await response.json();
    setCachedData(cacheKey, data);
    return data;
  } catch (error) {
    if (
      error.message.includes("not found") || 
      error.message.includes("rate limit") || 
      error.message.includes("forbidden")
    ) {
      throw error;
    }
    throw new Error("Failed to communicate with GitHub. Please check your network connection.");
  }
};

export const getRepository = async (repoOwner, repoName) => {
  return await githubFetch("", repoOwner, repoName);
};

export const getContributors = async (repoOwner, repoName) => {
  return await githubFetch("contributors", repoOwner, repoName);
};

export const getCommits = async (repoOwner, repoName) => {
  return await githubFetch("commits?per_page=10", repoOwner, repoName);
};

export const getLanguages = async (repoOwner, repoName) => {
  return await githubFetch("languages", repoOwner, repoName);
};

export const getIssues = async (repoOwner, repoName) => {
  return await githubFetch("issues?state=open&per_page=10", repoOwner, repoName);
};

export const getPullRequests = async (repoOwner, repoName) => {
  return await githubFetch("pulls?state=open&per_page=10", repoOwner, repoName);
};
