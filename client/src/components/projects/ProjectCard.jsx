import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const categoryStyles = {
  Hackathon: "bg-primary-tint text-primary border-primary/25",
  Startup: "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Open Source": "bg-sky-50 text-sky-700 border-sky-200",
  Research: "bg-amber-50 text-amber-700 border-amber-200",
  "Personal Project": "bg-indigo-50 text-indigo-700 border-indigo-200",
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
    maxTeamSize = 5,
    currentTeamSize = 1,
  } = project;

  // Calculate vacancies from roles
  const openRolesCount = roles.reduce(
    (acc, curr) => (curr.status === "open" ? acc + curr.vacancies : acc),
    0
  );

  const truncatedDesc =
    description.length > 120 ? `${description.slice(0, 120)}...` : description;

  const initials = creator.name
    ? creator.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "TF";

  const isFull = currentTeamSize >= maxTeamSize;

  return (
    <motion.div
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="group relative bg-card-surface border border-border-slate hover:border-primary/50 transition-all duration-200 rounded-card p-6 flex flex-col justify-between shadow-subtle hover:shadow-card"
    >
      <div>
        {/* Category & Team Gauge */}
        <div className="flex items-center justify-between mb-3.5">
          <span
            className={`text-xs font-bold px-3 py-1 rounded-full border ${
              categoryStyles[category] || "bg-[#F8F5EF] text-text-secondary border-border-slate"
            }`}
          >
            {category}
          </span>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary bg-[#FAF8F4] px-2.5 py-1 rounded-full border border-border-slate">
            <span className={`w-1.5 h-1.5 rounded-full ${isFull ? "bg-text-muted" : "bg-success"}`} />
            <span>{currentTeamSize}/{maxTeamSize} Members</span>
          </div>
        </div>

        {/* Title */}
        <Link to={`/projects/${_id}`}>
          <h3 className="text-charcoal font-black text-xl mb-2.5 group-hover:text-primary transition-colors tracking-tight line-clamp-1">
            {title}
          </h3>
        </Link>

        {/* Description excerpt */}
        <p className="text-text-muted text-sm leading-relaxed mb-5 line-clamp-3">
          {truncatedDesc}
        </p>

        {/* Skills Required */}
        {skillsRequired.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-5">
            {skillsRequired.slice(0, 4).map((skill) => (
              <span
                key={skill}
                className="text-xs font-medium bg-[#F8F5EF] text-charcoal border border-border-slate px-2.5 py-0.5 rounded-md"
              >
                {skill}
              </span>
            ))}
            {skillsRequired.length > 4 && (
              <span className="text-xs text-text-muted font-bold pl-1 self-center">
                +{skillsRequired.length - 4} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer Info & Creator */}
      <div className="pt-4 border-t border-border-slate flex items-center justify-between mt-auto">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-charcoal text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-subtle">
            {initials}
          </div>
          <div className="min-w-0">
            <span className="text-xs font-bold text-charcoal block leading-tight truncate">
              {creator.name}
            </span>
            <span className="text-[10px] text-text-muted block leading-none mt-0.5 truncate">
              {creator.college ? `${creator.college}` : creator.branch || "Student Lead"}
            </span>
          </div>
        </div>

        {/* Action Link */}
        <Link
          to={`/projects/${_id}`}
          className="text-xs font-bold text-primary hover:text-primary-hover transition-colors flex items-center gap-1 shrink-0 group/link"
        >
          <span>View Details</span>
          <svg
            className="w-3.5 h-3.5 transform group-hover/link:translate-x-0.5 transition-transform"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </Link>
      </div>
    </motion.div>
  );
};

export default ProjectCard;
