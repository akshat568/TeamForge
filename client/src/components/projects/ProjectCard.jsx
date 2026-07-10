import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const categoryColors = {
  Hackathon: "bg-primary/10 text-primary-light border-primary/20",
  Startup: "bg-success/10 text-success border-success/20",
  "Open Source": "bg-info/10 text-info border-info/20",
  Research: "bg-warning/10 text-warning border-warning/20",
  "Personal Project": "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
};

const ProjectCard = ({ project }) => {
  const {
    _id,
    title,
    description,
    category,
    skillsRequired = [],
    roles = [],
    creator = {},
    maxTeamSize,
    currentTeamSize,
  } = project;

  // Calculate vacancies from roles
  const openRolesCount = roles.reduce(
    (acc, curr) => (curr.status === "open" ? acc + curr.vacancies : acc),
    0
  );

  const truncatedDesc =
    description.length > 110 ? `${description.slice(0, 110)}...` : description;

  const initials = creator.name
    ? creator.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "TF";

  return (
    <motion.div
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      className="group relative bg-card-surface border border-border-slate hover:border-primary transition-all duration-200 rounded-card p-6 flex flex-col justify-between overflow-hidden shadow-subtle"
    >
      {/* Background card glow hover effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

      <div className="relative z-10">
        {/* Category & Status */}
        <div className="flex items-center justify-between mb-4">
          <span
            className={`text-xs font-semibold px-3 py-1 rounded-full border ${
              categoryColors[category] || "bg-gray-500/10 text-gray-300 border-gray-500/20"
            }`}
          >
            {category}
          </span>
          <span className="text-xs text-gray-400 font-medium">
            Team: {currentTeamSize}/{maxTeamSize || 10}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-white font-extrabold text-xl mb-2 group-hover:text-primary-light transition-colors tracking-tight">
          {title}
        </h3>

        {/* Description excerpt */}
        <p className="text-gray-400 text-sm leading-relaxed mb-5">
          {truncatedDesc}
        </p>

        {/* Skills Required */}
        {skillsRequired.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-5">
            {skillsRequired.slice(0, 4).map((skill) => (
              <span
                key={skill}
                className="text-[11px] bg-white/5 text-gray-300 border border-border-slate px-2 py-0.5 rounded"
              >
                {skill}
              </span>
            ))}
            {skillsRequired.length > 4 && (
              <span className="text-[11px] text-gray-400 font-medium pl-1 self-center">
                +{skillsRequired.length - 4} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="relative z-10 pt-4 border-t border-border-slate flex items-center justify-between mt-auto">
        <div className="flex items-center gap-2.5">
          {/* Creator Initials Circle */}
          <div className="w-8 h-8 rounded-full gradient-bg flex items-center justify-center font-bold text-xs text-white">
            {initials}
          </div>
          <div>
            <span className="text-xs font-semibold text-gray-300 block leading-tight">
              {creator.name}
            </span>
            <span className="text-[10px] text-gray-400 block leading-none mt-0.5">
              {creator.year} • {creator.branch}
            </span>
          </div>
        </div>

        {/* Action button */}
        <Link
          to={`/projects/${_id}`}
          className="text-xs font-semibold text-primary hover:text-primary-hover transition-colors flex items-center gap-1 group/btn"
        >
          View Details
          <svg
            className="w-3.5 h-3.5 transform group-hover/btn:translate-x-0.5 transition-transform"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </Link>
      </div>
    </motion.div>
  );
};

export default ProjectCard;
