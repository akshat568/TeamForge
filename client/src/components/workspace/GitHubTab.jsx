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
    if (!commits || commits.length === 0) return { label: "Inactive", color: "text-danger bg-danger/10 border-danger/25" };
    const latestCommitDate = new Date(commits[0].commitTime);
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const isActive = latestCommitDate >= fourteenDaysAgo;
    return isActive
      ? { label: "Active", color: "text-success bg-success/10 border-success/30" }
      : { label: "Quiet", color: "text-warning bg-warning/10 border-warning/30" };
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
        <div className="w-10 h-10 rounded-full border-3 border-primary/20 border-t-primary animate-spin" />
        <p className="text-xs font-semibold text-muted-text animate-pulse">Syncing GitHub workspace repository...</p>
      </div>
    );
  }

  // EMPTY STATE: Link form
  if (!repoData) {
    return (
      <div className="max-w-2xl mx-auto py-10 px-4">
        <div className="bg-card-surface border border-border-slate rounded-card p-8 md:p-10 text-center space-y-6 shadow-card">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-[#FF6B2C]/10 border border-primary/20 flex items-center justify-center text-3xl shadow-inner-soft">
            🐙
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-black text-primary-text tracking-tight">Integrate GitHub Repository</h3>
            <p className="text-xs md:text-sm text-muted-text max-w-md mx-auto leading-relaxed">
              Link a public GitHub repository to stream real-time commits, contributor rosters, open issues, and pull requests directly into your workspace.
            </p>
          </div>

          {isCreator ? (
            <form onSubmit={handleLinkRepo} className="max-w-md mx-auto space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1 text-left">
                  <label className="text-[10px] uppercase tracking-wider text-muted-text font-bold ml-1">Owner / Org</label>
                  <input
                    type="text"
                    value={ownerInput}
                    onChange={(e) => setOwnerInput(e.target.value)}
                    placeholder="e.g. facebook"
                    className="w-full bg-[#FAF7F2] border border-border-slate rounded-input px-3.5 py-2.5 text-xs text-primary-text placeholder:text-muted-text/60 focus:outline-none focus:border-primary focus:bg-white transition-colors"
                  />
                </div>
                <div className="space-y-1 text-left">
                  <label className="text-[10px] uppercase tracking-wider text-muted-text font-bold ml-1">Repository Name</label>
                  <input
                    type="text"
                    value={repoInput}
                    onChange={(e) => setRepoInput(e.target.value)}
                    placeholder="e.g. react"
                    className="w-full bg-[#FAF7F2] border border-border-slate rounded-input px-3.5 py-2.5 text-xs text-primary-text placeholder:text-muted-text/60 focus:outline-none focus:border-primary focus:bg-white transition-colors"
                  />
                </div>
              </div>
              {error && (
                <div className="p-3 bg-danger/10 border border-danger/20 rounded-input text-xs font-semibold text-danger text-left">
                  {error}
                </div>
              )}
              <button
                type="submit"
                disabled={linkingRepo}
                className="w-full py-3 rounded-btn font-bold text-xs text-white bg-primary hover:bg-primary-hover disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-subtle transition-all duration-200"
              >
                {linkingRepo ? "Verifying & Linking..." : "Link Repository"}
              </button>
            </form>
          ) : (
            <div className="pt-2">
              <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-warning bg-warning/10 border border-warning/25">
                ⚠️ No repository linked to this workspace. Only the Project Creator can connect a repository.
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card-surface border border-border-slate p-5 rounded-card shadow-card">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-2xl">🐙</span>
            <h2 className="text-lg md:text-xl font-black tracking-tight text-primary-text truncate">
              {repoData.owner}/{repoData.name}
            </h2>
            <span className={`text-[10px] px-2.5 py-0.5 rounded-full border ${health.color} font-bold`}>
              {health.label}
            </span>
          </div>
          {repoData.description && (
            <p className="text-xs text-muted-text mt-1.5 truncate max-w-2xl leading-relaxed">{repoData.description}</p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href={repoData.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-btn text-xs font-bold text-primary-text bg-[#FAF7F2] hover:bg-[#F2ECE1] border border-border-slate flex items-center gap-1.5 transition cursor-pointer"
          >
            Open on GitHub ↗
          </a>
          <button
            onClick={loadAllData}
            className="px-3.5 py-2 rounded-btn text-xs font-bold text-muted-text hover:text-primary-text bg-white hover:bg-[#FAF7F2] border border-border-slate transition cursor-pointer"
          >
            Refresh
          </button>
          {isCreator && (
            <button
              onClick={handleRemoveRepo}
              className="px-3.5 py-2 rounded-btn text-xs font-bold text-danger bg-danger/10 border border-danger/20 hover:bg-danger hover:text-white transition cursor-pointer"
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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Stars", value: repoData.stars, emoji: "⭐" },
          { label: "Forks", value: repoData.forks, emoji: "🍴" },
          { label: "Watchers", value: repoData.watchers, emoji: "👁️" },
          { label: "Contributors", value: contributors.length, emoji: "👥" },
          { label: "Open Issues", value: repoData.openIssuesCount, emoji: "🐛" },
          { label: "Commits", value: commits.length, emoji: "📊" },
        ].map((stat, i) => (
          <div key={i} className="bg-card-surface border border-border-slate p-4 rounded-card text-center shadow-subtle hover:border-primary/40 transition-colors">
            <span className="text-lg block mb-1">{stat.emoji}</span>
            <span className="text-[10px] text-muted-text block uppercase tracking-wider font-bold">{stat.label}</span>
            <span className="text-base font-black text-primary-text block mt-0.5">{stat.value}</span>
          </div>
        ))}
      </div>

      {/* TWO COLUMN GRID: HEALTH/LANGUAGES & COMMITS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: HEALTH & LANGUAGES */}
        <div className="space-y-6 lg:col-span-1">
          {/* Health Summary Card */}
          <div className="bg-card-surface border border-border-slate p-5 rounded-card space-y-4 shadow-subtle">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-text">Repository Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between border-b border-border-slate/60 pb-2 text-xs">
                <span className="text-muted-text">Default Branch</span>
                <span className="font-bold text-primary-text">{repoData.defaultBranch}</span>
              </div>
              <div className="flex justify-between border-b border-border-slate/60 pb-2 text-xs">
                <span className="text-muted-text">Primary Lang</span>
                <span className="font-bold text-primary">{repoData.primaryLanguage || "None"}</span>
              </div>
              <div className="flex justify-between border-b border-border-slate/60 pb-2 text-xs">
                <span className="text-muted-text">Open Issues</span>
                <span className="font-bold text-warning">{repoData.openIssuesCount}</span>
              </div>
              <div className="flex justify-between border-b border-border-slate/60 pb-2 text-xs">
                <span className="text-muted-text">Contributors</span>
                <span className="font-bold text-primary-text">{contributors.length}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-text">Last Commit</span>
                <span className="font-semibold text-muted-text">
                  {commits.length > 0 ? formatDate(commits[0].commitTime).split(",")[0] : "Never"}
                </span>
              </div>
            </div>
          </div>

          {/* Languages breakdown */}
          <div className="bg-card-surface border border-border-slate p-5 rounded-card space-y-4 shadow-subtle">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-text">Language Breakdown</h3>
            <div className="space-y-3">
              {repoData.languages && repoData.languages.length > 0 ? (
                repoData.languages.map((lang, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-primary-text">{lang.name}</span>
                      <span className="text-primary font-bold">{lang.percentage}%</span>
                    </div>
                    <div className="w-full bg-[#FAF7F2] h-2 rounded-full overflow-hidden border border-border-slate">
                      <div
                        className="bg-primary h-full rounded-full transition-all duration-500"
                        style={{ width: `${lang.percentage}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-primary-text">{repoData.primaryLanguage || "Repository Code"}</span>
                    <span className="text-primary font-bold">100%</span>
                  </div>
                  <div className="w-full bg-[#FAF7F2] h-2 rounded-full overflow-hidden border border-border-slate">
                    <div className="bg-primary h-full rounded-full" style={{ width: "100%" }} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: COMMITS SECTION */}
        <div className="bg-card-surface border border-border-slate p-5 rounded-card lg:col-span-2 flex flex-col h-[420px] shadow-subtle">
          <div className="flex items-center justify-between border-b border-border-slate pb-3 mb-3 shrink-0 gap-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-text">Recent Commits</h3>
            <input
              type="text"
              placeholder="Filter by author or message..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#FAF7F2] border border-border-slate rounded-input px-3 py-1.5 text-xs text-primary-text placeholder:text-muted-text/60 focus:outline-none focus:border-primary focus:bg-white w-52 transition-colors"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {filteredCommits.length > 0 ? (
              filteredCommits.map((commit, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedCommit(commit)}
                  className="flex items-center justify-between p-3 rounded-card bg-[#FAF7F2]/60 hover:bg-[#F2ECE1] border border-border-slate/70 transition cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {commit.avatar ? (
                      <img src={commit.avatar} alt={commit.author} className="w-7 h-7 rounded-full shrink-0 border border-border-slate" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-[10px] text-primary shrink-0">
                        {commit.author.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-primary-text truncate max-w-md">{commit.message}</h4>
                      <p className="text-[10px] text-muted-text truncate mt-0.5">
                        <span className="font-semibold text-secondary-charcoal">{commit.author}</span> committed on {formatDate(commit.commitTime).split(" at")[0]}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-md font-mono shrink-0 select-none font-bold">
                    {formatShortSha(commit.sha)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-center text-xs text-muted-text py-12">No matching commits found.</p>
            )}
          </div>
        </div>
      </div>

      {/* THREE COLUMN GRID: CONTRIBUTORS, ISSUES, PULL REQUESTS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* COLUMN 1: CONTRIBUTORS */}
        <div className="bg-card-surface border border-border-slate p-5 rounded-card h-[360px] flex flex-col shadow-subtle">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-text border-b border-border-slate pb-3 mb-3 shrink-0">
            Contributors ({contributors.length})
          </h3>
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar">
            {contributors.length > 0 ? (
              contributors.map((contrib, idx) => (
                <div
                  key={idx}
                  onClick={() => window.open(contrib.profileUrl, "_blank")}
                  className="flex items-center justify-between p-2.5 rounded-card bg-[#FAF7F2]/60 border border-border-slate/70 cursor-pointer hover:border-primary hover:bg-[#F2ECE1] transition"
                >
                  <div className="flex items-center gap-2.5">
                    <img src={contrib.avatar} alt={contrib.username} className="w-7 h-7 rounded-full border border-border-slate" />
                    <span className="text-xs font-bold text-primary-text">{contrib.username}</span>
                  </div>
                  <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                    {contrib.contributions} commits
                  </span>
                </div>
              ))
            ) : (
              <p className="text-center text-xs text-muted-text py-12">No contributors listed.</p>
            )}
          </div>
        </div>

        {/* COLUMN 2: OPEN ISSUES */}
        <div className="bg-card-surface border border-border-slate p-5 rounded-card h-[360px] flex flex-col shadow-subtle">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-text border-b border-border-slate pb-3 mb-3 shrink-0">
            Open Issues ({issues.length})
          </h3>
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar">
            {issues.length > 0 ? (
              issues.map((issue, idx) => (
                <a
                  key={idx}
                  href={issue.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-3 rounded-card bg-[#FAF7F2]/60 hover:bg-[#F2ECE1] border border-border-slate/70 transition"
                >
                  <h4 className="text-xs font-bold text-primary-text truncate">{issue.title}</h4>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] text-muted-text font-medium">#{issue.number} • {formatDate(issue.createdDate).split(",")[0]}</span>
                    <span className="text-[9px] font-bold text-warning bg-warning/10 border border-warning/25 px-1.5 py-0.5 rounded uppercase">
                      {issue.status}
                    </span>
                  </div>
                </a>
              ))
            ) : (
              <p className="text-center text-xs text-muted-text py-12">No open issues found.</p>
            )}
          </div>
        </div>

        {/* COLUMN 3: PULL REQUESTS */}
        <div className="bg-card-surface border border-border-slate p-5 rounded-card h-[360px] flex flex-col shadow-subtle">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-text border-b border-border-slate pb-3 mb-3 shrink-0">
            Pull Requests ({pulls.length})
          </h3>
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar">
            {pulls.length > 0 ? (
              pulls.map((pull, idx) => (
                <a
                  key={idx}
                  href={pull.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-3 rounded-card bg-[#FAF7F2]/60 hover:bg-[#F2ECE1] border border-border-slate/70 transition"
                >
                  <h4 className="text-xs font-bold text-primary-text truncate">{pull.title}</h4>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] text-muted-text font-medium">by {pull.author} • {formatDate(pull.createdDate).split(",")[0]}</span>
                    <span className="text-[9px] font-bold text-success bg-success/10 border border-success/25 px-1.5 py-0.5 rounded uppercase">
                      {pull.state}
                    </span>
                  </div>
                </a>
              ))
            ) : (
              <p className="text-center text-xs text-muted-text py-12">No open pull requests found.</p>
            )}
          </div>
        </div>
      </div>

      {/* COMMIT DETAIL MODAL */}
      {selectedCommit && (
        <div className="fixed inset-0 bg-secondary-charcoal/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-card-surface border border-border-slate rounded-card p-6 max-w-md w-full relative space-y-4 shadow-modal">
            <button
              onClick={() => setSelectedCommit(null)}
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-[#FAF7F2] border border-border-slate flex items-center justify-center text-xs text-muted-text hover:text-primary-text transition cursor-pointer"
            >
              ✕
            </button>
            <h3 className="text-base font-black text-primary-text tracking-tight">Commit Details</h3>

            <div className="space-y-3.5 pt-1">
              <div className="flex items-center gap-3">
                {selectedCommit.avatar ? (
                  <img src={selectedCommit.avatar} alt={selectedCommit.author} className="w-9 h-9 rounded-full border border-border-slate" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-xs text-primary">
                    {selectedCommit.author.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <h4 className="text-xs font-bold text-primary-text">{selectedCommit.author}</h4>
                  <p className="text-[10px] text-muted-text">{formatDate(selectedCommit.commitTime)}</p>
                </div>
              </div>

              <div className="space-y-1 bg-[#FAF7F2] border border-border-slate p-3.5 rounded-input text-xs leading-relaxed text-primary-text">
                <span className="text-[9px] uppercase tracking-wider text-muted-text font-bold block mb-1">Commit Message</span>
                {selectedCommit.message}
              </div>

              <div className="flex justify-between text-xs bg-[#FAF7F2] border border-border-slate p-3.5 rounded-input">
                <div className="space-y-0.5">
                  <span className="text-[9px] uppercase tracking-wider text-muted-text font-bold block">SHA</span>
                  <span className="font-mono text-xs font-bold text-primary-text">{selectedCommit.sha}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setSelectedCommit(null)}
                className="flex-1 py-2.5 rounded-btn border border-border-slate hover:bg-[#FAF7F2] text-xs font-bold text-muted-text hover:text-primary-text transition cursor-pointer"
              >
                Close
              </button>
              <a
                href={selectedCommit.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2.5 rounded-btn text-xs font-bold text-center text-white bg-primary hover:bg-primary-hover flex items-center justify-center cursor-pointer shadow-subtle transition-all duration-200"
              >
                Open on GitHub ↗
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GitHubTab;
