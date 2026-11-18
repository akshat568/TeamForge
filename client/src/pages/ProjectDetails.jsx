import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { getProjectById } from "../services/projectService";
import { getMyApplications } from "../services/applicationService";
import { useAuth } from "../context/AuthContext";
import ApplyModal from "../components/projects/ApplyModal";

const categoryStyles = {
  Hackathon: "bg-primary-tint text-primary border-primary/25",
  Startup: "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Open Source": "bg-sky-50 text-sky-700 border-sky-200",
  Research: "bg-amber-50 text-amber-700 border-amber-200",
  "Personal Project": "bg-indigo-50 text-indigo-700 border-indigo-200",
};

const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, isAuthenticated } = useAuth();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [hasApplied, setHasApplied] = useState(false);
  const [appliedStatus, setAppliedStatus] = useState("");
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);

  const fetchProjectDetails = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getProjectById(id);
      if (data.success) {
        setProject(data.project);
      } else {
        setError("Project listing not found");
      }
    } catch (err) {
      setError(err.message || "Failed to load project details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectDetails();
  }, [id]);

  useEffect(() => {
    const checkUserApplication = async () => {
      if (!isAuthenticated) return;
      try {
        const res = await getMyApplications();
        if (res.success) {
          const existingApp = res.applications.find(
            (app) => app.project && app.project._id === id
          );
          if (existingApp) {
            setHasApplied(true);
            setAppliedStatus(existingApp.status);
          }
        }
      } catch (err) {
        console.error("Failed to check user applications:", err.message);
      }
    };
    checkUserApplication();
  }, [id, isAuthenticated]);

  const handleApplyClick = () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    setIsApplyModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-base flex flex-col items-center justify-center">
        <div className="w-9 h-9 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-text-muted text-xs mt-3 tracking-wider font-semibold">
          Loading project specifications...
        </span>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center px-6">
        <div className="text-center max-w-md bg-card-surface p-8 rounded-card border border-border-slate shadow-premium space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-50 text-danger mx-auto flex items-center justify-center text-xl">
            ⚠️
          </div>
          <h2 className="text-2xl font-black text-charcoal">Error Loading Project</h2>
          <p className="text-text-muted text-sm leading-relaxed">
            {error || "The project you are looking for does not exist or was removed."}
          </p>
          <Link
            to="/projects"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-btn font-bold text-xs text-white bg-primary hover:bg-primary-hover shadow-orange-sm transition-all"
          >
            ← Back to Browse
          </Link>
        </div>
      </div>
    );
  }

  const {
    title,
    description,
    category,
    skillsRequired = [],
    roles = [],
    creator = {},
    maxTeamSize = 5,
    currentTeamSize = 1,
    githubUrl,
    status = "open",
  } = project;

  const isCreator = currentUser && (creator._id === currentUser.id || creator._id === currentUser._id);

  const initials = creator.name
    ? creator.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "TF";

  const progressPercentage = Math.min(100, (currentTeamSize / maxTeamSize) * 100);

  return (
    <div className="min-h-screen bg-bg-base text-text-primary pt-28 pb-20 px-4 sm:px-6 lg:px-8 relative">
      <div className="max-w-5xl mx-auto relative z-10 space-y-8">
        
        {/* Navigation Breadcrumb */}
        <Link
          to="/projects"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-text-muted hover:text-charcoal transition-colors group"
        >
          <svg
            className="w-4 h-4 transform group-hover:-translate-x-0.5 transition-transform"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back to Browse Projects</span>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Main Content Details - 2 Columns */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-card-surface border border-border-slate p-7 md:p-8 rounded-card space-y-6 shadow-subtle">
              
              {/* Category & Status */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <span
                  className={`text-xs font-bold px-3.5 py-1.5 rounded-full border ${
                    categoryStyles[category] || "bg-[#F8F5EF] text-text-secondary border-border-slate"
                  }`}
                >
                  {category}
                </span>

                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      status === "full" ? "bg-text-muted" : "bg-success"
                    } animate-pulse`}
                  />
                  <span
                    className={`text-xs font-bold capitalize ${
                      status === "full" ? "text-text-muted" : "text-success"
                    }`}
                  >
                    Project status: {status}
                  </span>
                </div>
              </div>

              {/* Title */}
              <h1 className="text-3xl md:text-4xl font-black text-charcoal tracking-tight">
                {title}
              </h1>

              {/* GitHub Link */}
              {githubUrl && (
                <a
                  href={githubUrl.startsWith("http") ? githubUrl : `https://${githubUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-xs font-bold text-charcoal px-3.5 py-2 rounded-btn border border-border-slate bg-[#FAF8F4] hover:bg-white transition-all cursor-pointer shadow-subtle w-fit"
                >
                  <svg className="w-4 h-4 text-charcoal" fill="currentColor" viewBox="0 0 24 24">
                    <path
                      fillRule="evenodd"
                      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Source Repository</span>
                  <svg className="w-3 h-3 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )}

              {/* Description */}
              <div className="space-y-2 pt-2">
                <h3 className="text-xs font-bold text-primary uppercase tracking-wider">
                  Project Overview
                </h3>
                <p className="text-text-secondary text-sm md:text-base leading-relaxed whitespace-pre-line">
                  {description}
                </p>
              </div>

              {/* Skills */}
              <div className="space-y-3 pt-3 border-t border-border-slate">
                <h3 className="text-xs font-bold text-primary uppercase tracking-wider">
                  Required Technology Stack
                </h3>
                <div className="flex flex-wrap gap-2">
                  {skillsRequired.map((skill) => (
                    <span
                      key={skill}
                      className="text-xs font-semibold bg-[#F8F5EF] text-charcoal border border-border-slate px-3 py-1 rounded-md"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Vacancy Roles Required */}
            <div className="bg-card-surface border border-border-slate p-7 md:p-8 rounded-card space-y-6 shadow-subtle">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black text-charcoal">
                  Open Vacancies & Roles
                </h2>
                <span className="text-xs font-semibold text-text-muted">
                  {roles.filter(r => r.status === "open").length} open positions
                </span>
              </div>

              {roles.length === 0 ? (
                <p className="text-text-muted text-xs italic">
                  No specific role vacancies listed for this team.
                </p>
              ) : (
                <div className="space-y-3">
                  {roles.map((role) => (
                    <div
                      key={role._id}
                      className="flex items-center justify-between p-4 bg-[#FAF8F4] border border-border-slate rounded-card shadow-subtle"
                    >
                      <div>
                        <h4 className="font-bold text-charcoal text-sm leading-snug">
                          {role.roleName}
                        </h4>
                        <p className="text-xs text-text-muted mt-0.5 font-medium">
                          Available Spots: <strong className="text-charcoal">{role.vacancies}</strong>
                        </p>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-3 py-1 rounded-full border uppercase ${
                          role.status === "open"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-red-50 text-danger border-red-200"
                        }`}
                      >
                        {role.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Panel - Capacity Meter & Creator Card */}
          <div className="space-y-6">
            
            {/* Team Size Capacity Card */}
            <div className="bg-card-surface border border-border-slate rounded-card p-6 space-y-5 shadow-subtle">
              <h3 className="text-xs font-bold uppercase tracking-wider text-charcoal">
                Team Capacity
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold text-text-muted">
                  <span>Current Roster</span>
                  <span className="text-charcoal font-bold">
                    {currentTeamSize} / {maxTeamSize} Members
                  </span>
                </div>
                <div className="w-full bg-[#F8F5EF] h-2.5 rounded-full overflow-hidden border border-border-slate">
                  <div
                    className="bg-primary h-full rounded-full transition-all duration-500"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              {isCreator ? (
                <div className="space-y-2.5 pt-2">
                  <Link
                    to={`/workspace/${id}`}
                    className="w-full text-center block py-3 rounded-btn text-xs font-bold text-white bg-primary hover:bg-primary-hover shadow-orange-sm transition-all cursor-pointer"
                  >
                    Open Workspace Board
                  </Link>
                  <Link
                    to={`/projects/${id}/applications`}
                    className="w-full text-center block py-3 rounded-btn text-xs font-bold text-charcoal bg-[#F8F5EF] hover:bg-white border border-border-slate transition-all"
                  >
                    Review Applicants
                  </Link>
                </div>
              ) : (
                <div className="space-y-2 pt-2">
                  {hasApplied && appliedStatus === "accepted" ? (
                    <div className="space-y-2.5">
                      <div className="w-full text-center py-2.5 rounded-btn text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200">
                        ✓ Application Accepted
                      </div>
                      <Link
                        to={`/workspace/${id}`}
                        className="w-full text-center block py-3 rounded-btn text-xs font-bold text-white bg-primary hover:bg-primary-hover shadow-orange-sm transition-all"
                      >
                        Open Workspace Board
                      </Link>
                    </div>
                  ) : hasApplied ? (
                    <div className="w-full text-center py-3 rounded-btn text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200">
                      Application Pending ({appliedStatus})
                    </div>
                  ) : status === "full" || currentTeamSize >= maxTeamSize ? (
                    <div className="w-full text-center py-3 rounded-btn text-xs font-bold text-text-muted bg-[#F8F5EF] border border-border-slate">
                      Project Full
                    </div>
                  ) : (
                    <button
                      onClick={handleApplyClick}
                      className="w-full text-center block py-3.5 rounded-btn text-sm font-bold text-white bg-primary hover:bg-primary-hover shadow-orange transition-all hover:-translate-y-0.5 cursor-pointer"
                    >
                      Apply to Join Team
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Creator Information Card */}
            <div className="bg-card-surface border border-border-slate rounded-card p-6 shadow-subtle space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-charcoal pb-2 border-b border-border-slate">
                Project Lead
              </h3>

              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-full bg-charcoal text-white flex items-center justify-center font-black text-sm shadow-subtle shrink-0">
                  {initials}
                </div>
                <div className="min-w-0">
                  <h4 className="font-extrabold text-charcoal text-sm truncate">{creator.name}</h4>
                  <p className="text-xs text-text-muted truncate">{creator.email}</p>
                </div>
              </div>

              <div className="space-y-3 text-xs border-t border-border-slate pt-3">
                <div>
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">
                    College / University
                  </span>
                  <span className="text-charcoal font-semibold block mt-0.5">{creator.college || "University Student"}</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">
                      Branch
                    </span>
                    <span className="text-charcoal font-semibold block mt-0.5">{creator.branch || "Engineer"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">
                      Year
                    </span>
                    <span className="text-charcoal font-semibold block mt-0.5">{creator.year || "Student"}</span>
                  </div>
                </div>

                {creator.bio && (
                  <div>
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">
                      About Lead
                    </span>
                    <p className="text-text-secondary text-xs mt-1 leading-normal italic">
                      "{creator.bio}"
                    </p>
                  </div>
                )}

                {isAuthenticated && hasApplied && appliedStatus === "accepted" && (
                  <div className="pt-2 border-t border-border-slate">
                    <Link
                      to={`/chat?type=direct&id=${creator._id}`}
                      className="w-full text-center block py-2 rounded-btn text-xs font-bold text-white bg-primary hover:bg-primary-hover shadow-orange-sm transition-all"
                    >
                      Chat with Creator
                    </Link>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Apply Modal overlay */}
      <ApplyModal
        project={project}
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        onSuccess={() => {
          setHasApplied(true);
          setAppliedStatus("pending");
          const refresh = async () => {
            try {
              const data = await getProjectById(id);
              if (data.success) {
                setProject(data.project);
              }
            } catch (e) {
              console.error(e);
            }
          };
          refresh();
        }}
      />
    </div>
  );
};

export default ProjectDetails;
