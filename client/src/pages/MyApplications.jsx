import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { getMyApplications } from "../services/applicationService";
import { formatDate } from "../utils/helpers";

const statusBadges = {
  pending: "bg-warning/10 text-warning border-warning/25",
  accepted: "bg-success/10 text-success border-success/25",
  rejected: "bg-danger/10 text-danger border-danger/25",
};

const MyApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [expandedApp, setExpandedApp] = useState(null);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getMyApplications();
      if (data.success) {
        setApplications(data.applications);
      } else {
        setError("Failed to load applications");
      }
    } catch (err) {
      setError(err.message || "Failed to retrieve your applications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const filteredApps = applications.filter((app) => {
    if (activeTab === "all") return true;
    return app.status === activeTab;
  });

  const toggleExpand = (id) => {
    setExpandedApp(expandedApp === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-bg-base text-primary-text pt-28 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
          <div>
            <span className="text-[11px] font-bold text-primary uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
              Applications Tracker
            </span>
            <h1 className="text-3xl md:text-4xl font-black mt-3 tracking-tight text-primary-text">
              My Sent <span className="text-primary">Applications</span>
            </h1>
            <p className="text-muted-text text-xs md:text-sm mt-1.5 max-w-lg leading-relaxed">
              Track join requests you've submitted to project creators across hackathons and campus initiatives.
            </p>
          </div>
          <div>
            <Link
              to="/projects"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-btn font-bold text-xs text-primary-text bg-card-surface hover:bg-[#FAF7F2] border border-border-slate transition-all shadow-subtle"
            >
              Browse More Projects ↗
            </Link>
          </div>
        </div>

        {/* Status Tabs */}
        <div className="flex border-b border-border-slate gap-6 mb-8 text-xs overflow-x-auto scrollbar-none font-bold">
          {["all", "pending", "accepted", "rejected"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 capitalize relative cursor-pointer whitespace-nowrap transition-colors ${
                activeTab === tab ? "text-primary" : "text-muted-text hover:text-primary-text"
              }`}
            >
              {tab === "all" ? "All Applications" : `${tab} Requests`}
              {activeTab === tab && (
                <motion.div
                  layoutId="activeTabUnderline"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                />
              )}
            </button>
          ))}
        </div>

        {/* Content list */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card-surface border border-border-slate rounded-card p-6 h-28 animate-pulse shadow-subtle" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16 bg-card-surface border border-danger/20 rounded-card shadow-card">
            <p className="text-danger text-sm mb-4 font-semibold">{error}</p>
            <button onClick={fetchApplications} className="px-4 py-2 rounded-btn text-xs font-bold bg-primary hover:bg-primary-hover text-white transition-colors">
              Retry
            </button>
          </div>
        ) : filteredApps.length === 0 ? (
          <div className="text-center py-20 bg-card-surface border border-border-slate rounded-card shadow-card">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-2xl mx-auto mb-4">
              📝
            </div>
            <h3 className="text-base font-bold text-primary-text mb-1">No applications found</h3>
            <p className="text-muted-text text-xs max-w-xs mx-auto leading-relaxed">
              {activeTab === "all"
                ? "You haven't applied to any projects yet. Start exploring active listings!"
                : `You don't have any applications currently marked as ${activeTab}.`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredApps.map((app) => {
              const proj = app.project || {};
              const targetRole = proj.roles?.find((r) => r._id === app.roleId);
              const isExpanded = expandedApp === app._id;

              return (
                <motion.div
                  key={app._id}
                  layout
                  className="bg-card-surface border border-border-slate hover:border-primary/50 rounded-card overflow-hidden transition-all duration-200 shadow-card"
                >
                  <div className="p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <Link
                          to={`/projects/${proj._id}`}
                          className="text-base font-black text-primary-text hover:text-primary transition-colors tracking-tight"
                        >
                          {proj.title || "Project"}
                        </Link>
                        <span className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full border ${statusBadges[app.status]}`}>
                          ● {app.status}
                        </span>
                      </div>
                      <p className="text-xs text-muted-text">
                        Role: <span className="text-primary font-bold">{targetRole?.roleName || "Position"}</span>
                      </p>
                      <p className="text-[11px] text-muted-text">
                        Applied: {formatDate(app.createdAt)}
                      </p>
                    </div>

                    <button
                      onClick={() => toggleExpand(app._id)}
                      className="text-xs font-bold text-primary hover:text-primary-hover transition-colors flex items-center gap-1 self-start md:self-center cursor-pointer"
                    >
                      {isExpanded ? "Hide Details" : "Show Submitted Details"}
                      <svg
                        className={`w-3.5 h-3.5 transform transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>

                  {/* Expandable Application Form Section */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-t border-border-slate bg-[#FAF7F2] px-6 py-5 space-y-4 text-xs"
                      >
                        {/* Introduction */}
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-muted-text uppercase tracking-wider block">My Introduction</span>
                          <p className="text-primary-text leading-relaxed font-medium">{app.introduction}</p>
                        </div>

                        {/* Why Join */}
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-muted-text uppercase tracking-wider block">Why I want to join</span>
                          <p className="text-primary-text leading-relaxed font-medium">{app.whyJoin}</p>
                        </div>

                        {/* Skills */}
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-muted-text uppercase tracking-wider block">Skills Shared</span>
                          <div className="flex flex-wrap gap-1.5 pt-0.5">
                            {app.skills?.map((skill) => (
                              <span key={skill} className="text-[10px] bg-white text-primary border border-border-slate px-2.5 py-0.5 rounded-lg font-bold shadow-subtle">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* GitHub profile URL */}
                        {app.githubUrl && (
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-muted-text uppercase tracking-wider block">GitHub Profile Link</span>
                            <a
                              href={app.githubUrl.startsWith("http") ? app.githubUrl : `https://${app.githubUrl}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:text-primary-hover font-bold inline-flex items-center gap-1"
                            >
                              🐙 {app.githubUrl} ↗
                            </a>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyApplications;
