import { useState, useEffect } from "react";
import api from "../../services/api";
import {
  getRepositoryInfo,
  getCommitsList,
  getContributorsList,
  getIssuesList,
  getPullRequestsList,
} from "../../services/githubService";

const GitHubTab = ({ projectId, isCreator }) => {
  // Config states
  const [repoData, setRepoData] = useState(null);
  const [commits, setCommits] = useState([]);
  const [contributors, setContributors] = useState([]);
  const [issues, setIssues] = useState([]);
  const [pulls, setPulls] = useState([]);

  // UI state managers
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCommit, setSelectedCommit] = useState(null);

  // Link form inputs
  const [ownerInput, setOwnerInput] = useState("");
  const [repoInput, setRepoInput] = useState("");
  const [linkingRepo, setLinkingRepo] = useState(false);

  const loadAllData = async () => {
    setLoading(true);
    setError("");
    try {
      const repoRes = await getRepositoryInfo(projectId);
      if (repoRes.success && repoRes.linked) {
        setRepoData(repoRes.data);
        
        // Fetch remaining details concurrently
        const [commitsRes, contribsRes, issuesRes, pullsRes] = await Promise.all([
          getCommitsList(projectId).catch(() => ({ commits: [] })),
          getContributorsList(projectId).catch(() => ({ contributors: [] })),
          getIssuesList(projectId).catch(() => ({ issues: [] })),
          getPullRequestsList(projectId).catch(() => ({ pulls: [] })),
        ]);

        setCommits(commitsRes.commits || []);
        setContributors(contribsRes.contributors || []);
        setIssues(issuesRes.issues || []);
        setPulls(pullsRes.pulls || []);
      } else {
        setRepoData(null);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to load GitHub repository details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [projectId]);

  const handleLinkRepo = async (e) => {
    e.preventDefault();
    if (!ownerInput.trim() || !repoInput.trim()) {
      setError("Please fill out both owner and repository name fields.");
      return;
    }
    setError("");
    setLinkingRepo(true);
    try {
      const repoPath = `${ownerInput.trim()}/${repoInput.trim()}`;
      if (!/^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+$/.test(repoPath)) {
        throw new Error("Invalid format. Repository must be 'owner/repository'.");
      }

      // Update project schema linking
      const res = await api.put(`/projects/${projectId}`, {
        githubRepository: repoPath,
        githubUrl: `https://github.com/${repoPath}`,
      });

      if (res.data.success) {
        setOwnerInput("");
        setRepoInput("");
        await loadAllData();
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to link GitHub repository.");
    } finally {
      setLinkingRepo(false);
    }
  };

  const handleRemoveRepo = async () => {
    if (!window.confirm("Are you sure you want to unlink this GitHub repository?")) return;
    setError("");
    setLoading(true);
    try {
      const res = await api.put(`/projects/${projectId}`, {
        githubRepository: "",
        githubUrl: "",
      });
      if (res.data.success) {
        setRepoData(null);
        setCommits([]);
        setContributors([]);
        setIssues([]);
        setPulls([]);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to unlink repository.");
    } finally {
      setLoading(false);
    }
  };

  // Determine repository activity health
  const getRepositoryHealth = () => {
    if (!commits || commits.length === 0) return { label: "Inactive", color: "text-danger bg-danger/10 border-danger/20" };
    const latestCommitDate = new Date(commits[0].commitTime);
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const isActive = latestCommitDate >= fourteenDaysAgo;
    return isActive 
      ? { label: "Active", color: "text-success bg-success/10 border-success/20" }
      : { label: "Inactive", color: "text-warning bg-warning/10 border-warning/20" };
  };

  const formatShortSha = (sha) => {
    if (!sha) return "";
    return sha.substring(0, 7);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const options = { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Client-side commits filtering
  const filteredCommits = commits.filter((c) => {
    const q = searchQuery.toLowerCase();
    return c.author.toLowerCase().includes(q) || c.message.toLowerCase().includes(q);
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        <p className="text-sm text-gray-400 animate-pulse">Fetching GitHub workspace metadata...</p>
      </div>
    );
  }

  // EMPTY STATE: Link form
  if (!repoData) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="bg-bg-secondary border border-border-slate rounded-card p-8 text-center space-y-6 shadow-premium">
          <div className="w-16 h-16 mx-auto rounded-card bg-primary/10 border border-primary/20 flex items-center justify-center text-3xl">
            🐙
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-white tracking-tight">Integrate GitHub Repository</h3>
            <p className="text-sm text-gray-400 max-w-md mx-auto leading-relaxed">
              Link a public GitHub repository to pull live metadata, view commits lists, contributor rosters, open issues, and pull requests directly in TeamForge.
            </p>
          </div>

          {isCreator ? (
            <form onSubmit={handleLinkRepo} className="max-w-md mx-auto space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1 text-left">
                  <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Owner / Username</label>
                  <input
                    type="text"
                    value={ownerInput}
                    onChange={(e) => setOwnerInput(e.target.value)}
                    placeholder="e.g. facebook"
                    className="w-full bg-card-surface border border-border-slate rounded-input px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-1 text-left">
                  <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Repository Name</label>
                  <input
                    type="text"
                    value={repoInput}
                    onChange={(e) => setRepoInput(e.target.value)}
                    placeholder="e.g. react"
                    className="w-full bg-card-surface border border-border-slate rounded-input px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
              {error && <p className="text-xs text-danger font-semibold">{error}</p>}
              <button
                type="submit"
                disabled={linkingRepo}
                className="w-full py-2.5 rounded-btn font-bold text-xs text-white bg-primary hover:bg-primary-hover disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer transition-colors duration-200"
              >
                {linkingRepo ? "Verifying & Linking..." : "Link Repository"}
              </button>
            </form>
          ) : (
            <div className="pt-4">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-warning bg-warning/10 border border-warning/20">
                ⚠️ No repository linked to this workspace. Only the Project Creator can link a repository.
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  const health = getRepositoryHealth();

  return (
    <div className="space-y-6 pb-12">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-slate pb-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xl">🐙</span>
            <h2 className="text-xl font-black tracking-tight text-white truncate">
              {repoData.owner}/{repoData.name}
            </h2>
            <span className={`text-[10px] px-2 py-0.5 rounded border ${health.color} font-bold`}>
              {health.label}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1 truncate max-w-2xl">{repoData.description}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href={repoData.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-btn text-xs font-bold text-gray-300 bg-card-surface hover:bg-hover-surface border border-border-slate flex items-center gap-1.5 transition cursor-pointer"
          >
            Open Github
          </a>
          <button
            onClick={loadAllData}
            className="px-4 py-2 rounded-btn text-xs font-bold text-gray-300 bg-card-surface hover:bg-hover-surface border border-border-slate transition cursor-pointer"
          >
            Refresh
          </button>
          {isCreator && (
            <button
              onClick={handleRemoveRepo}
              className="px-4 py-2 rounded-btn text-xs font-bold text-danger bg-danger/10 border border-danger/20 hover:bg-danger hover:text-white transition cursor-pointer"
            >
              Unlink
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-card bg-danger/10 border border-danger/20 text-xs font-semibold text-danger">
          {error}
        </div>
      )}

      {/* OVERVIEW STATS CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: "Stars", value: repoData.stars, emoji: "⭐" },
          { label: "Forks", value: repoData.forks, emoji: "🍴" },
          { label: "Watchers", value: repoData.watchers, emoji: "👁️" },
          { label: "Contributors", value: contributors.length, emoji: "👥" },
          { label: "Open Issues", value: repoData.openIssuesCount, emoji: "🐛" },
          { label: "Loaded Commits", value: commits.length, emoji: "📊" },
        ].map((stat, i) => (
          <div key={i} className="bg-card-surface border border-border-slate p-4 rounded-card text-center shadow-subtle">
            <span className="text-xl block mb-1">{stat.emoji}</span>
            <span className="text-[10px] text-gray-400 block uppercase tracking-wider font-bold">{stat.label}</span>
            <span className="text-lg font-black text-white block mt-1">{stat.value}</span>
          </div>
        ))}
      </div>

      {/* TWO COLUMN GRID: HEALTH/LANGUAGES & COMMITS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: HEALTH & LANGUAGES */}
        <div className="space-y-6 lg:col-span-1">
          
          {/* Health Summary Card */}
          <div className="bg-bg-secondary border border-border-slate p-5 rounded-card space-y-4 shadow-subtle">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Repository Health</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between border-b border-border-slate/50 pb-2 text-xs">
                <span className="text-gray-400">Default Branch</span>
                <span className="font-semibold text-white">{repoData.defaultBranch}</span>
              </div>
              <div className="flex justify-between border-b border-border-slate/50 pb-2 text-xs">
                <span className="text-gray-400">Primary Lang</span>
                <span className="font-semibold text-white">{repoData.primaryLanguage || "None"}</span>
              </div>
              <div className="flex justify-between border-b border-border-slate/50 pb-2 text-xs">
                <span className="text-gray-400">Open Issues</span>
                <span className="font-semibold text-primary-light">{repoData.openIssuesCount}</span>
              </div>
              <div className="flex justify-between border-b border-border-slate/50 pb-2 text-xs">
                <span className="text-gray-400">Contributors</span>
                <span className="font-semibold text-white">{contributors.length}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Last Commit</span>
                <span className="font-semibold text-gray-400">
                  {commits.length > 0 ? formatDate(commits[0].commitTime).split(",")[0] : "Never"}
                </span>
              </div>
            </div>
          </div>

          {/* Languages breakdown progress bars */}
          <div className="bg-bg-secondary border border-border-slate p-5 rounded-card space-y-4 shadow-subtle">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Languages Breakdown</h3>

            <div className="space-y-3.5">
              {repoData.languages && repoData.languages.length > 0 ? (
                repoData.languages.map((lang, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-white">{lang.name}</span>
                      <span className="text-primary-light font-bold">{lang.percentage}%</span>
                    </div>
                    <div className="w-full bg-bg-base h-2 rounded-full overflow-hidden border border-border-slate">
                      <div
                        className="gradient-bg h-full rounded-full transition-all duration-500"
                        style={{ width: `${lang.percentage}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-white">{repoData.primaryLanguage || "Unknown"}</span>
                    <span className="text-primary-light font-bold">100%</span>
                  </div>
                  <div className="w-full bg-bg-base h-2 rounded-full overflow-hidden border border-border-slate">
                    <div className="gradient-bg h-full rounded-full" style={{ width: "100%" }} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: COMMITS SECTION */}
        <div className="bg-bg-secondary border border-border-slate p-5 rounded-card lg:col-span-2 flex flex-col h-[400px] shadow-subtle">
          
          <div className="flex items-center justify-between border-b border-border-slate pb-3 mb-4 shrink-0">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Recent Commits</h3>
            <input
              type="text"
              placeholder="Filter by author or msg..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-card-surface border border-border-slate rounded-input px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-primary max-w-xs"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {filteredCommits.length > 0 ? (
              filteredCommits.map((commit, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedCommit(commit)}
                  className="flex items-center justify-between p-3 rounded-card bg-card-surface/40 hover:bg-hover-surface border border-border-slate transition cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {commit.avatar ? (
                      <img src={commit.avatar} alt={commit.author} className="w-7 h-7 rounded-lg shrink-0 border border-border-slate" />
                    ) : (
                      <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-[10px] text-primary-light shrink-0">
                        {commit.author.slice(0,2).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h4 className="text-xs font-semibold text-white truncate max-w-md">{commit.message}</h4>
                      <p className="text-[10px] text-gray-400 truncate mt-0.5">
                        <span className="font-bold text-gray-300">{commit.author}</span> committed on {formatDate(commit.commitTime).split(" at")[0]}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-primary/10 text-primary-light border border-primary/20 px-2 py-0.5 rounded-md font-mono shrink-0 select-none">
                    {formatShortSha(commit.sha)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-center text-xs text-gray-500 py-10">No matching commits found.</p>
            )}
          </div>
        </div>
      </div>

      {/* THREE COLUMN GRID: CONTRIBUTORS, ISSUES, PULL REQUESTS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* COLUMN 1: CONTRIBUTORS */}
        <div className="bg-bg-secondary border border-border-slate p-5 rounded-card h-[350px] flex flex-col shadow-subtle">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 border-b border-border-slate pb-3 mb-4 shrink-0">
            Contributors
          </h3>
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {contributors.length > 0 ? (
              contributors.map((contrib, idx) => (
                <div
                  key={idx}
                  onClick={() => window.open(contrib.profileUrl, "_blank")}
                  className="flex items-center justify-between p-2.5 rounded-card bg-card-surface/40 border border-border-slate cursor-pointer hover:border-primary hover:bg-hover-surface transition"
                >
                  <div className="flex items-center gap-2.5">
                    <img src={contrib.avatar} alt={contrib.username} className="w-7 h-7 rounded-lg border border-border-slate" />
                    <span className="text-xs font-bold text-white">{contrib.username}</span>
                  </div>
                  <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                    {contrib.contributions} commits
                  </span>
                </div>
              ))
            ) : (
              <p className="text-center text-xs text-gray-500 py-10">No contributors listed.</p>
            )}
          </div>
        </div>

        {/* COLUMN 2: OPEN ISSUES */}
        <div className="bg-bg-secondary border border-border-slate p-5 rounded-card h-[350px] flex flex-col shadow-subtle">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 border-b border-border-slate pb-3 mb-4 shrink-0">
            Open Issues
          </h3>
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {issues.length > 0 ? (
              issues.map((issue, idx) => (
                <a
                  key={idx}
                  href={issue.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-3 rounded-card bg-card-surface/40 hover:bg-hover-surface border border-border-slate transition"
                >
                  <h4 className="text-xs font-semibold text-white truncate">{issue.title}</h4>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[9px] text-gray-400">#{issue.number} • {formatDate(issue.createdDate).split(",")[0]}</span>
                    <span className="text-[9px] font-bold text-warning bg-warning/10 border border-warning/20 px-1.5 py-0.5 rounded uppercase animate-none">
                      {issue.status}
                    </span>
                  </div>
                </a>
              ))
            ) : (
              <p className="text-center text-xs text-gray-500 py-10">No open issues found.</p>
            )}
          </div>
        </div>

        {/* COLUMN 3: PULL REQUESTS */}
        <div className="bg-bg-secondary border border-border-slate p-5 rounded-card h-[350px] flex flex-col shadow-subtle">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 border-b border-border-slate pb-3 mb-4 shrink-0">
            Pull Requests
          </h3>
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {pulls.length > 0 ? (
              pulls.map((pull, idx) => (
                <a
                  key={idx}
                  href={pull.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-3 rounded-card bg-card-surface/40 hover:bg-hover-surface border border-border-slate transition"
                >
                  <h4 className="text-xs font-semibold text-white truncate">{pull.title}</h4>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[9px] text-gray-400">by {pull.author} • {formatDate(pull.createdDate).split(",")[0]}</span>
                    <span className="text-[9px] font-bold text-success bg-success/10 border border-success/20 px-1.5 py-0.5 rounded uppercase animate-none">
                      {pull.state}
                    </span>
                  </div>
                </a>
              ))
            ) : (
              <p className="text-center text-xs text-gray-500 py-10">No open pull requests found.</p>
            )}
          </div>
        </div>
      </div>

      {/* COMMIT DETAIL MODAL */}
      {selectedCommit && (
        <div className="fixed inset-0 bg-bg-base/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-bg-secondary border border-border-slate rounded-modal p-6 max-w-md w-full relative space-y-4 shadow-premium animate-none">
            <button
              onClick={() => setSelectedCommit(null)}
              className="absolute top-4 right-4 w-6 h-6 rounded-full bg-card-surface border border-border-slate flex items-center justify-center text-xs text-gray-400 hover:text-white transition cursor-pointer"
            >
              ✕
            </button>
            <h3 className="text-base font-bold text-white tracking-tight">Commit Details</h3>
            
            <div className="space-y-3.5 pt-2">
              <div className="flex items-center gap-3">
                {selectedCommit.avatar ? (
                  <img src={selectedCommit.avatar} alt={selectedCommit.author} className="w-9 h-9 rounded-lg border border-border-slate" />
                ) : (
                  <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-xs text-primary-light">
                    {selectedCommit.author.slice(0,2).toUpperCase()}
                  </div>
                )}
                <div>
                  <h4 className="text-xs font-bold text-white">{selectedCommit.author}</h4>
                  <p className="text-[10px] text-gray-400">{formatDate(selectedCommit.commitTime)}</p>
                </div>
              </div>

              <div className="space-y-1 bg-card-surface border border-border-slate p-3.5 rounded-card text-xs leading-relaxed text-gray-300">
                <span className="text-[9px] uppercase tracking-wider text-gray-500 font-bold block mb-1">Message</span>
                {selectedCommit.message}
              </div>

              <div className="flex justify-between text-xs bg-card-surface border border-border-slate p-3.5 rounded-card">
                <div className="space-y-0.5">
                  <span className="text-[9px] uppercase tracking-wider text-gray-500 font-bold block">SHA</span>
                  <span className="font-mono text-gray-300">{selectedCommit.sha}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-3">
              <button
                onClick={() => setSelectedCommit(null)}
                className="flex-1 py-2.5 rounded-btn border border-border-slate hover:bg-hover-surface text-xs font-bold text-gray-400 hover:text-white transition cursor-pointer"
              >
                Close
              </button>
              <a
                href={selectedCommit.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2.5 rounded-btn text-xs font-bold text-center text-white bg-primary hover:bg-primary-hover flex items-center justify-center cursor-pointer transition-colors duration-200"
              >
                Open on GitHub
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GitHubTab;
