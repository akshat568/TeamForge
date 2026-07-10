import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { getMyApplications } from "../services/applicationService";
import { formatDate } from "../utils/helpers";

const statusBadges = {
  pending: "bg-warning/10 text-warning border-warning/20",
  accepted: "bg-success/10 text-success border-success/20",
  rejected: "bg-danger/10 text-danger border-danger/20",
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
    <div className="min-h-screen bg-bg-base text-white pt-28 pb-16 px-6 relative overflow-hidden">
      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12">
          <div>
            <span className="text-xs font-semibold text-primary-light uppercase tracking-widest bg-primary/10 px-3.5 py-1.5 rounded-full border border-primary/20">
              Applications Tracker
            </span>
            <h1 className="text-3xl md:text-4xl font-black mt-4 tracking-tight">
              My Sent <span className="gradient-text">Applications</span>
            </h1>
            <p className="text-gray-400 text-sm mt-2 max-w-lg">
              Track requests you've submitted to join other student hackathons, startup ideas, or projects.
            </p>
          </div>
          <div>
            <Link
              to="/projects"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-btn font-semibold text-sm text-gray-300 hover:text-white border border-border-slate hover:bg-hover-surface transition-all duration-200"
            >
              Browse More Projects
            </Link>
          </div>
        </div>

        {/* Status Tabs */}
        <div className="flex border-b border-border-slate gap-6 mb-8 text-sm overflow-x-auto scrollbar-none">
          {["all", "pending", "accepted", "rejected"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 font-semibold capitalize relative cursor-pointer whitespace-nowrap transition-colors ${
                activeTab === tab ? "text-primary-light" : "text-gray-400 hover:text-white"
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
          /* Skeletons loader */
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card-surface border border-border-slate rounded-card p-6 h-28 animate-pulse shadow-subtle" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16 bg-bg-secondary border border-danger/20 rounded-card shadow-subtle">
            <p className="text-danger text-sm mb-4">{error}</p>
            <button onClick={fetchApplications} className="px-4 py-2 rounded-btn text-xs font-semibold bg-primary hover:bg-primary-hover text-white transition-colors duration-200">
              Retry
            </button>
          </div>
        ) : filteredApps.length === 0 ? (
          /* Empty state */
          <div className="text-center py-20 bg-bg-secondary border border-border-slate rounded-card shadow-subtle">
            <svg className="w-14 h-14 text-primary-light/30 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-bold text-white mb-2">No applications found</h3>
            <p className="text-gray-500 text-xs max-w-xs mx-auto leading-relaxed">
              {activeTab === "all"
                ? "You haven't applied to any projects yet. Start exploring active listings!"
                : `You don't have any applications currently marked as ${activeTab}.`}
            </p>
          </div>
        ) : (
          /* Applications list */
          <div className="space-y-4">
            {filteredApps.map((app) => {
              const proj = app.project || {};
              const targetRole = proj.roles?.find((r) => r._id === app.roleId);
              const isExpanded = expandedApp === app._id;

              return (
                <motion.div
                  key={app._id}
                  layout
                  className="bg-card-surface border border-border-slate hover:border-primary rounded-card overflow-hidden transition-all duration-200 shadow-subtle"
                >
                  <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <Link
                          to={`/projects/${proj._id}`}
                          className="text-lg font-bold text-white hover:text-primary-light transition-colors tracking-tight"
                        >
                          {proj.title || "Unknown Project"}
                        </Link>
                        <span className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full border ${statusBadges[app.status]}`}>
                          {app.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400">
                        Role: <span className="text-primary-light font-semibold">{targetRole?.roleName || "Position"}</span>
                      </p>
                      <p className="text-[11px] text-gray-400">
                        Applied: {formatDate(app.createdAt)}
                      </p>
                    </div>

                    <button
                      onClick={() => toggleExpand(app._id)}
                      className="text-xs font-semibold text-primary hover:text-primary-hover transition-colors flex items-center gap-1 self-start md:self-center cursor-pointer"
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
                        className="border-t border-border-slate/50 bg-bg-secondary/40 px-6 py-5 space-y-4 text-sm"
                      >
                        {/* Introduction */}
                        <div className="space-y-1.5">
                          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">My Introduction</span>
                          <p className="text-gray-300 leading-relaxed text-xs md:text-sm">{app.introduction}</p>
                        </div>

                        {/* Why Join */}
                        <div className="space-y-1.5">
                          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Why I want to join</span>
                          <p className="text-gray-300 leading-relaxed text-xs md:text-sm">{app.whyJoin}</p>
                        </div>

                        {/* Skills */}
                        <div className="space-y-1.5">
                          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Skills Shared</span>
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {app.skills.map((skill) => (
                              <span key={skill} className="text-[11px] bg-primary/10 text-primary-light border border-primary/20 px-2 py-0.5 rounded font-medium">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* GitHub profile URL */}
                        {app.githubUrl && (
                          <div className="space-y-1.5">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">GitHub Profile Link</span>
                            <a
                              href={app.githubUrl.startsWith("http") ? app.githubUrl : `https://${app.githubUrl}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:text-primary-hover transition-colors inline-block"
                            >
                              {app.githubUrl}
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
