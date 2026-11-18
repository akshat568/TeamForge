import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { getProjectApplications, updateApplicationStatus } from "../services/applicationService";
import { formatDate } from "../utils/helpers";

const ProjectApplications = () => {
  const { id: projectId } = useParams();

  const [project, setProject] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getProjectApplications(projectId);
      if (data.success) {
        setProject(data.project);
        setApplications(data.applications);
      } else {
        setError("Failed to retrieve applications");
      }
    } catch (err) {
      setError(err.message || "Failed to load project applications. Verify that you are the creator.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [projectId]);

  const handleProcessApplication = async (id, status) => {
    try {
      setProcessingId(id);
      setError("");
      setSuccessMessage("");

      const res = await updateApplicationStatus(id, status);
      if (res.success) {
        setSuccessMessage(res.message || `Application successfully ${status}`);
        await fetchApplications();
      } else {
        setError(res.message || `Failed to ${status} application`);
      }
    } catch (err) {
      setError(err.message || `Failed to ${status} application`);
    } finally {
      setProcessingId(null);
    }
  };

  const pendingApps = applications.filter((app) => app.status === "pending");
  const processedApps = applications.filter((app) => app.status !== "pending");

  const isProjectFull = project && project.currentTeamSize >= project.maxTeamSize;

  return (
    <div className="min-h-screen bg-bg-base text-primary-text pt-28 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="max-w-5xl mx-auto relative z-10">
        {/* Back Link */}
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-text hover:text-primary mb-6 transition-colors group"
        >
          <svg className="w-3.5 h-3.5 transform group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Dashboard
        </Link>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <div className="w-10 h-10 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
            <span className="text-muted-text text-xs tracking-wider font-semibold animate-pulse">Loading candidate roster...</span>
          </div>
        ) : error || !project ? (
          <div className="text-center py-16 bg-card-surface border border-danger/20 rounded-card shadow-card">
            <p className="text-danger text-sm mb-4 font-semibold">{error || "Failed to load project details."}</p>
            <button onClick={fetchApplications} className="px-4 py-2 rounded-btn text-xs font-bold bg-primary hover:bg-primary-hover text-white transition-colors">
              Retry
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Project Overview Card */}
            <div className="bg-card-surface border border-border-slate p-6 md:p-8 rounded-card flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-card">
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-primary uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                  Creator Review Panel
                </span>
                <h1 className="text-2xl md:text-3xl font-black tracking-tight text-primary-text">
                  Review Applications: <span className="text-primary">{project.title}</span>
                </h1>
                <p className="text-muted-text text-xs md:text-sm">
                  Manage incoming candidate requests. Team Capacity: <strong className="text-primary-text">{project.currentTeamSize} / {project.maxTeamSize}</strong> members
                </p>
              </div>

              {isProjectFull ? (
                <div className="bg-danger/10 text-danger border border-danger/20 px-4 py-2 rounded-btn text-xs font-bold shrink-0 self-start md:self-center">
                  ⚠️ Team Reached Max Capacity
                </div>
              ) : (
                <div className="w-full md:w-48 bg-[#FAF7F2] h-2.5 rounded-full overflow-hidden border border-border-slate self-center">
                  <div
                    className="bg-primary h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (project.currentTeamSize / project.maxTeamSize) * 100)}%` }}
                  />
                </div>
              )}
            </div>

            {/* Notification alert message */}
            <AnimatePresence>
              {successMessage && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="p-4 bg-success/10 border border-success/20 text-success text-xs font-bold rounded-card flex items-center gap-2 shadow-subtle"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{successMessage}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Pending Candidates */}
            <div className="space-y-4">
              <h2 className="text-lg font-black tracking-tight text-primary-text flex items-center gap-2">
                Pending Applicants
                <span className="text-xs bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 rounded-full font-bold">
                  {pendingApps.length}
                </span>
              </h2>

              {pendingApps.length === 0 ? (
                <div className="text-center py-16 bg-card-surface border border-border-slate rounded-card shadow-subtle">
                  <p className="text-muted-text text-xs font-semibold">No pending applications for this project listing.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingApps.map((app) => {
                    const applicant = app.applicant || {};
                    const role = project.roles?.find((r) => r._id === app.roleId);
                    const initials = applicant.name
                      ? applicant.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
                      : "TF";

                    const isProcessing = processingId === app._id;

                    return (
                      <motion.div
                        key={app._id}
                        layout
                        className="bg-card-surface border border-border-slate rounded-card p-6 md:p-7 space-y-5 shadow-card"
                      >
                        {/* Top Profile Header */}
                        <div className="flex flex-col md:flex-row justify-between gap-4 border-b border-border-slate pb-4">
                          <div className="flex gap-3.5 items-center">
                            <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-black text-sm text-primary shrink-0 shadow-subtle">
                              {initials}
                            </div>
                            <div className="space-y-0.5">
                              <h3 className="font-black text-primary-text text-base leading-snug">{applicant.name}</h3>
                              <p className="text-xs text-primary font-bold">
                                {applicant.college} • {applicant.year} • {applicant.branch}
                              </p>
                              <p className="text-[10px] text-muted-text font-medium">
                                Applied: {formatDate(app.createdAt)}
                              </p>
                            </div>
                          </div>

                          <div className="space-y-0.5 md:text-right self-start md:self-center">
                            <span className="text-[10px] text-muted-text uppercase tracking-wider block font-bold">Applying for role</span>
                            <span className="text-sm font-black text-primary block">{role?.roleName || "Position"}</span>
                          </div>
                        </div>

                        {/* Questions/Cover letter */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs bg-[#FAF7F2] p-4 rounded-input border border-border-slate">
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-muted-text uppercase tracking-wider block">Short Introduction</span>
                            <p className="text-primary-text leading-relaxed font-medium italic">"{app.introduction}"</p>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-muted-text uppercase tracking-wider block">Why join?</span>
                            <p className="text-primary-text leading-relaxed font-medium italic">"{app.whyJoin}"</p>
                          </div>
                        </div>

                        {/* Profile Skills & Links */}
                        <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-muted-text uppercase tracking-wider block">Skills</span>
                            <div className="flex flex-wrap gap-1.5">
                              {app.skills?.map((skill) => (
                                <span key={skill} className="text-[10px] bg-white text-primary-text border border-border-slate px-2 py-0.5 rounded-lg font-bold shadow-subtle">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            {app.githubUrl && (
                              <a
                                href={app.githubUrl.startsWith("http") ? app.githubUrl : `https://${app.githubUrl}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs font-bold text-primary hover:text-primary-hover transition-colors flex items-center gap-1"
                              >
                                🐙 GitHub ↗
                              </a>
                            )}

                            {applicant.linkedin && (
                              <a
                                href={applicant.linkedin.startsWith("http") ? applicant.linkedin : `https://${applicant.linkedin}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs font-bold text-primary hover:text-primary-hover transition-colors border-l border-border-slate pl-3 flex items-center gap-1"
                              >
                                🔗 LinkedIn ↗
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Actions accepts/rejects */}
                        <div className="flex justify-end gap-3 border-t border-border-slate pt-4">
                          <button
                            type="button"
                            disabled={isProcessing || processingId !== null}
                            onClick={() => handleProcessApplication(app._id, "rejected")}
                            className="px-5 py-2.5 rounded-btn text-xs font-bold text-danger hover:text-red-700 border border-danger/25 hover:bg-danger/10 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            Reject Candidate
                          </button>
                          <button
                            type="button"
                            disabled={isProcessing || processingId !== null || isProjectFull}
                            onClick={() => handleProcessApplication(app._id, "accepted")}
                            className="px-5 py-2.5 rounded-btn text-xs font-bold text-white bg-primary hover:bg-primary-hover transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-subtle"
                          >
                            {isProcessing ? "Processing..." : isProjectFull ? "Project Full" : "Accept & Add to Team"}
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Processed Candidates (history log) */}
            {processedApps.length > 0 && (
              <div className="space-y-4 pt-4 border-t border-border-slate">
                <h2 className="text-base font-black tracking-tight text-primary-text flex items-center gap-2">
                  Processed Applications
                  <span className="text-xs bg-[#FAF7F2] text-muted-text border border-border-slate px-2.5 py-0.5 rounded-full font-bold">
                    {processedApps.length}
                  </span>
                </h2>

                <div className="space-y-2.5">
                  {processedApps.map((app) => {
                    const applicant = app.applicant || {};
                    const role = project.roles?.find((r) => r._id === app.roleId);

                    return (
                      <div
                        key={app._id}
                        className="bg-card-surface border border-border-slate rounded-card p-4 flex items-center justify-between gap-4 text-xs shadow-subtle"
                      >
                        <div className="space-y-0.5">
                          <h4 className="font-bold text-primary-text text-sm leading-snug">{applicant.name || "Student Builder"}</h4>
                          <p className="text-xs text-muted-text font-medium">
                            Role: <span className="text-primary font-bold">{role?.roleName || "Position"}</span> • {formatDate(app.createdAt)}
                          </p>
                        </div>

                        <span
                          className={`text-[10px] font-bold px-3 py-1 rounded-full border uppercase ${
                            app.status === "accepted"
                              ? "bg-success/10 text-success border-success/25"
                              : "bg-danger/10 text-danger border-danger/25"
                          }`}
                        >
                          ● {app.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectApplications;
