import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { getProjectById } from "../services/projectService";
import { getMyApplications } from "../services/applicationService";
import { useAuth } from "../context/AuthContext";
import ApplyModal from "../components/projects/ApplyModal";

const categoryColors = {
  Hackathon: "bg-primary/10 text-primary-light border-primary/20",
  Startup: "bg-success/10 text-success border-success/20",
  "Open Source": "bg-info/10 text-info border-info/20",
  Research: "bg-warning/10 text-warning border-warning/20",
  "Personal Project": "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
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
        <div className="relative flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full"
          />
        </div>
        <span className="text-gray-400 text-sm mt-4 tracking-wider animate-pulse">
          Loading project specs...
        </span>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center px-6">
        <div className="text-center max-w-md bg-bg-secondary p-8 rounded-card border border-border-slate shadow-premium">
          <h2 className="text-2xl font-black text-white mb-4">Error Loading Project</h2>
          <p className="text-gray-400 mb-8 leading-relaxed">
            {error || "The project you are looking for does not exist."}
          </p>
          <Link
            to="/projects"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-btn font-semibold text-white bg-primary hover:bg-primary-hover shadow-subtle transition-colors duration-200"
          >
            Back to Browse
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
    maxTeamSize,
    currentTeamSize,
    githubUrl,
    status,
  } = project;

  const isCreator = currentUser && creator._id === currentUser.id;

  // Calculate initials
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
    <div className="min-h-screen bg-bg-base text-white pt-28 pb-16 px-6 relative overflow-hidden">
      <div className="max-w-5xl mx-auto relative z-10">
        {/* Navigation Breadcrumb */}
        <Link
          to="/projects"
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-8 transition-colors group"
        >
          <svg
            className="w-4 h-4 transform group-hover:-translate-x-0.5 transition-transform"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Browse
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Details - 2 Columns */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-bg-secondary border border-border-slate p-8 rounded-card space-y-6 shadow-subtle">
              {/* Category, Status & Team Progress */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <span
                  className={`text-xs font-semibold px-3.5 py-1.5 rounded-full border ${
                    categoryColors[category] || "bg-gray-500/10 text-gray-300 border-gray-500/20"
                  }`}
                >
                  {category}
                </span>

                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      status === "full" ? "bg-danger" : "bg-success"
                    } animate-pulse`}
                  />
                  <span
                    className={`text-xs font-medium capitalize ${
                      status === "full" ? "text-danger" : "text-success"
                    }`}
                  >
                    Project status: {status}
                  </span>
                </div>
              </div>

              {/* Title */}
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                {title}
              </h1>

              {/* GitHub Link */}
              {githubUrl && (
                <a
                  href={githubUrl.startsWith("http") ? githubUrl : `https://${githubUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-white px-3.5 py-2 rounded-btn border border-border-slate hover:bg-hover-surface transition-all cursor-pointer"
                >
                  <svg className="w-4.5 h-4.5 text-primary-light" fill="currentColor" viewBox="0 0 24 24">
                    <path
                      fillRule="evenodd"
                      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Source Repository
                </a>
              )}

              {/* Description */}
              <div className="space-y-3 pt-2">
                <h3 className="text-sm font-semibold text-primary-light uppercase tracking-wider">
                  Overview
                </h3>
                <p className="text-gray-300 text-sm md:text-base leading-relaxed whitespace-pre-line">
                  {description}
                </p>
              </div>

              {/* Skills */}
              <div className="space-y-3 pt-2 border-t border-border-slate">
                <h3 className="text-sm font-semibold text-primary-light uppercase tracking-wider">
                  Target Tech Stack & Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {skillsRequired.map((skill) => (
                    <span
                      key={skill}
                      className="text-xs bg-primary/10 text-primary-light border border-primary/20 px-3 py-1 rounded-lg font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Vacancy Roles Required */}
            <div className="bg-bg-secondary border border-border-slate p-8 rounded-card space-y-6 shadow-subtle">
              <h2 className="text-xl font-bold tracking-tight text-white">
                Open Vacancies / Required Roles
              </h2>

              {roles.length === 0 ? (
                <p className="text-gray-500 text-sm italic">
                  No vacancy positions explicitly listed for this team.
                </p>
              ) : (
                <div className="space-y-4">
                  {roles.map((role) => (
                    <div
                      key={role._id}
                      className="flex items-center justify-between p-4 bg-card-surface border border-border-slate rounded-card shadow-subtle"
                    >
                      <div>
                        <h4 className="font-bold text-white text-base leading-snug">
                          {role.roleName}
                        </h4>
                        <p className="text-xs text-gray-400 mt-1">Available Spots: {role.vacancies}</p>
                      </div>

                      <span
                        className={`text-[11px] font-bold px-3 py-1 rounded-full border uppercase ${
                          role.status === "open"
                            ? "bg-success/10 text-success border-success/20"
                            : "bg-danger/10 text-danger border-danger/20"
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

          {/* Sidebar Panel - Team size meter & Creator card */}
          <div className="space-y-8">
            {/* Team Size Card */}
            <div className="bg-bg-secondary border border-border-slate rounded-card p-6 space-y-4 shadow-subtle">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">
                Team Size Meter
              </h3>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400 font-medium">Capacity</span>
                <span className="text-white font-bold">
                  {currentTeamSize} / {maxTeamSize} Members
                </span>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-bg-base h-2 rounded-full overflow-hidden border border-border-slate">
                <div
                  className="gradient-bg h-full rounded-full transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>

              {/* Action Button */}
              {isCreator ? (
                <div className="space-y-3">
                  <Link
                    to={`/workspace/${id}`}
                    className="w-full text-center block py-3.5 rounded-btn text-sm font-semibold text-white bg-primary hover:bg-primary-hover shadow-subtle transition-all duration-200"
                  >
                    Open Workspace
                  </Link>
                  <Link
                    to={`/projects/${id}/applications`}
                    className="w-full text-center block py-3.5 rounded-btn text-sm font-semibold text-gray-300 hover:text-white border border-border-slate hover:bg-hover-surface transition-all duration-200"
                  >
                    View Applicants
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {hasApplied && appliedStatus === "accepted" ? (
                    <div className="space-y-3">
                      <button
                        disabled
                        className="w-full text-center block py-3.5 rounded-btn text-sm font-semibold text-success border border-success/20 opacity-80 cursor-not-allowed"
                      >
                        Application Accepted
                      </button>
                      <Link
                        to={`/workspace/${id}`}
                        className="w-full text-center block py-3.5 rounded-btn text-sm font-semibold text-white bg-primary hover:bg-primary-hover shadow-subtle transition-all duration-200"
                      >
                        Open Workspace
                      </Link>
                    </div>
                  ) : hasApplied ? (
                    <button
                      disabled
                      className="w-full text-center block py-3.5 rounded-btn text-sm font-semibold text-warning border border-warning/20 opacity-70 cursor-not-allowed"
                    >
                      Already Applied ({appliedStatus})
                    </button>
                  ) : status === "full" || currentTeamSize >= maxTeamSize ? (
                    <button
                      disabled
                      className="w-full text-center block py-3.5 rounded-btn text-sm font-semibold text-danger border border-danger/20 opacity-60 cursor-not-allowed"
                    >
                      Project Full
                    </button>
                  ) : (
                    <button
                      onClick={handleApplyClick}
                      className="w-full text-center block py-3.5 rounded-btn text-sm font-semibold text-white bg-primary hover:bg-primary-hover shadow-subtle transition-all duration-200 cursor-pointer"
                    >
                      Apply to Join Team
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Creator Information Card */}
            <div className="bg-bg-secondary border border-border-slate rounded-card p-6 shadow-subtle">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-6">
                Listed By Creator
              </h3>

              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-full gradient-bg flex items-center justify-center font-bold text-lg text-white">
                  {initials}
                </div>
                <div>
                  <h4 className="font-bold text-white text-base leading-snug">{creator.name}</h4>
                  <p className="text-xs text-primary-light font-medium">{creator.email}</p>
                </div>
              </div>

              <div className="space-y-4 text-sm text-gray-400 border-t border-border-slate pt-4">
                <div>
                  <span className="text-xs font-semibold text-gray-500 block uppercase tracking-wider">
                    College
                  </span>
                  <span className="text-white font-medium block mt-0.5">{creator.college}</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs font-semibold text-gray-500 block uppercase tracking-wider">
                      Branch
                    </span>
                    <span className="text-white font-medium block mt-0.5">{creator.branch}</span>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-gray-500 block uppercase tracking-wider">
                      Academic Year
                    </span>
                    <span className="text-white font-medium block mt-0.5">{creator.year}</span>
                  </div>
                </div>
                {creator.bio && (
                  <div>
                    <span className="text-xs font-semibold text-gray-500 block uppercase tracking-wider">
                      Creator Bio
                    </span>
                    <p className="text-gray-300 block text-xs mt-1 leading-normal italic">
                      "{creator.bio}"
                    </p>
                  </div>
                )}
                {isAuthenticated && hasApplied && appliedStatus === "accepted" && (
                  <div className="pt-2 border-t border-border-slate">
                    <Link
                      to={`/chat?type=direct&id=${creator._id}`}
                      className="w-full text-center block py-2.5 rounded-btn text-xs font-semibold text-white bg-primary hover:bg-primary-hover transition-all duration-200"
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
