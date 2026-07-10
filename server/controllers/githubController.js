import Project from "../models/project.js";
import { checkProjectMembership } from "../socket.js";
import * as githubService from "../services/githubService.js";

/**
 * Helper to split githubRepository field into owner and repo parts
 */
const getRepoConfig = (project) => {
  if (!project.githubRepository) {
    return null;
  }
  const parts = project.githubRepository.split("/");
  if (parts.length !== 2) {
    return null;
  }
  return { owner: parts[0], repo: parts[1] };
};

/**
 * @desc    Get repository metadata and languages percentages
 * @route   GET /api/github/repository/:projectId
 * @access  Private
 */
export const getRepositoryInfo = async (req, res, next) => {
  console.log("✅ getRepositoryInfo called");
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found." });
    }

    const isMember = await checkProjectMembership(projectId, req.user._id);
    if (!isMember) {
      return res.status(403).json({ success: false, message: "Not authorized to access this workspace." });
    }

    const repoConfig = getRepoConfig(project);
    if (!repoConfig) {
      return res.status(200).json({ success: true, linked: false });
    }

    const [repoData, languagesBytes] = await Promise.all([
      githubService.getRepository(repoConfig.owner, repoConfig.repo),
      githubService.getLanguages(repoConfig.owner, repoConfig.repo).catch(() => ({}))
    ]);

    // Calculate languages percentage contributions
    const totalBytes = Object.values(languagesBytes).reduce((a, b) => a + b, 0);
    let languages = [];
    if (totalBytes > 0) {
      languages = Object.entries(languagesBytes).map(([name, bytes]) => ({
        name,
        percentage: parseFloat(((bytes / totalBytes) * 100).toFixed(1))
      }));
    } else if (repoData.language) {
      languages = [{ name: repoData.language, percentage: 100 }];
    }

    return res.status(200).json({
      success: true,
      linked: true,
      data: {
        name: repoData.name,
        owner: repoData.owner.login,
        description: repoData.description || "",
        defaultBranch: repoData.default_branch,
        stars: repoData.stargazers_count,
        forks: repoData.forks_count,
        watchers: repoData.subscribers_count || repoData.watchers_count,
        openIssuesCount: repoData.open_issues_count,
        primaryLanguage: repoData.language || "",
        githubUrl: repoData.html_url,
        languages
      }
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get latest 10 commits
 * @route   GET /api/github/commits/:projectId
 * @access  Private
 */
export const getCommitsList = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found." });
    }

    const isMember = await checkProjectMembership(projectId, req.user._id);
    if (!isMember) {
      return res.status(403).json({ success: false, message: "Not authorized to access this workspace." });
    }

    const repoConfig = getRepoConfig(project);
    if (!repoConfig) {
      return res.status(200).json({ success: true, linked: false, commits: [] });
    }

    const commitsData = await githubService.getCommits(repoConfig.owner, repoConfig.repo);
    const commits = commitsData.map((commit) => ({
      sha: commit.sha,
      message: commit.commit.message,
      author: commit.commit.author.name,
      avatar: commit.author ? commit.author.avatar_url : "",
      commitTime: commit.commit.author.date,
      url: commit.html_url,
    }));

    return res.status(200).json({
      success: true,
      linked: true,
      commits,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get contributor list
 * @route   GET /api/github/contributors/:projectId
 * @access  Private
 */
export const getContributorsList = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found." });
    }

    const isMember = await checkProjectMembership(projectId, req.user._id);
    if (!isMember) {
      return res.status(403).json({ success: false, message: "Not authorized to access this workspace." });
    }

    const repoConfig = getRepoConfig(project);
    if (!repoConfig) {
      return res.status(200).json({ success: true, linked: false, contributors: [] });
    }

    const contributorsData = await githubService.getContributors(repoConfig.owner, repoConfig.repo);
   const contributors = contributorsData.map((c) => ({
  username: c.login,
  avatar: c.avatar_url,
  contributions: c.contributions,
  profileUrl: c.html_url,
}));

    return res.status(200).json({
      success: true,
      linked: true,
      contributors,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get latest open issues
 * @route   GET /api/github/issues/:projectId
 * @access  Private
 */
export const getIssuesList = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found." });
    }

    const isMember = await checkProjectMembership(projectId, req.user._id);
    if (!isMember) {
      return res.status(403).json({ success: false, message: "Not authorized to access this workspace." });
    }

    const repoConfig = getRepoConfig(project);
    if (!repoConfig) {
      return res.status(200).json({ success: true, linked: false, issues: [] });
    }

    const issuesData = await githubService.getIssues(repoConfig.owner, repoConfig.repo);
    console.log(issuesData);
    const issues = issuesData
      .filter((i) => !i.pull_request)
      .map((i) => ({
        title: i.title,
        number: i.number,
        createdDate: i.created_at,
        status: i.state,
        url: i.html_url,
      }));

    return res.status(200).json({
      success: true,
      linked: true,
      issues,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get latest pull requests
 * @route   GET /api/github/pulls/:projectId
 * @access  Private
 */
export const getPullRequestsList = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found." });
    }

    const isMember = await checkProjectMembership(projectId, req.user._id);
    if (!isMember) {
      return res.status(403).json({ success: false, message: "Not authorized to access this workspace." });
    }

    const repoConfig = getRepoConfig(project);
    if (!repoConfig) {
      return res.status(200).json({ success: true, linked: false, pulls: [] });
    }

    const pullsData = await githubService.getPullRequests(repoConfig.owner, repoConfig.repo);
    const pulls = pullsData.map((p) => ({
      title: p.title,
      author: p.user ? p.user.login : "",
      state: p.state,
      createdDate: p.created_at,
      url: p.html_url,
    }));

    return res.status(200).json({
      success: true,
      linked: true,
      pulls,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};
