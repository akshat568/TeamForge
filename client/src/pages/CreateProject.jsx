import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { createProject } from "../services/projectService";

const CreateProject = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    githubUrl: "",
    maxTeamSize: 5,
  });

  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState("");
  
  const [roles, setRoles] = useState([
    { roleName: "", vacancies: 1, status: "open" }
  ]);

  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (validationErrors[e.target.name]) {
      setValidationErrors({
        ...validationErrors,
        [e.target.name]: "",
      });
    }
    setError("");
  };

  // ─── Skill Tags Handlers ───────────────────────────────────────────────────
  const handleAddSkill = (e) => {
    e.preventDefault();
    const cleanInput = skillInput.trim();
    if (cleanInput && !skills.includes(cleanInput)) {
      setSkills([...skills, cleanInput]);
      setSkillInput("");
      if (validationErrors.skills) {
        setValidationErrors({
          ...validationErrors,
          skills: "",
        });
      }
    }
  };

  const handleKeyDownSkill = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddSkill(e);
    }
  };

  const handleRemoveSkill = (indexToRemove) => {
    setSkills(skills.filter((_, idx) => idx !== indexToRemove));
  };

  // ─── Dynamic Vacancy Roles Handlers ────────────────────────────────────────
  const handleAddRole = (e) => {
    e.preventDefault();
    setRoles([...roles, { roleName: "", vacancies: 1, status: "open" }]);
  };

  const handleRoleChange = (index, field, value) => {
    const updatedRoles = roles.map((role, idx) => {
      if (idx === index) {
        return {
          ...role,
          [field]: field === "vacancies" ? parseInt(value) || 1 : value,
        };
      }
      return role;
    });
    setRoles(updatedRoles);
    if (validationErrors.roles) {
      setValidationErrors({
        ...validationErrors,
        roles: "",
      });
    }
  };

  const handleRemoveRole = (indexToRemove) => {
    setRoles(roles.filter((_, idx) => idx !== indexToRemove));
  };

  // ─── Form Validations ──────────────────────────────────────────────────────
  const validateForm = () => {
    const errors = {};

    if (!formData.title.trim()) errors.title = "Project title is required";
    if (!formData.description.trim()) errors.description = "Project description is required";
    if (!formData.category) errors.category = "Please select a category";
    
    if (skills.length === 0) {
      errors.skills = "Please add at least one required skill";
    }

    // GitHub URL regex check
    if (formData.githubUrl.trim()) {
      const gitRegex = /^(https?:\/\/)?(www\.)?github\.com\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+\/?$/;
      if (!gitRegex.test(formData.githubUrl.trim())) {
        errors.githubUrl = "Please provide a valid GitHub repository URL (e.g. github.com/user/repo)";
      }
    }

    // Role checks
    const invalidRoles = roles.some((role) => !role.roleName.trim() || role.vacancies < 1);
    if (invalidRoles) {
      errors.roles = "All vacancy roles must have a name and at least 1 vacancy";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);
      setError("");

      const payload = {
        ...formData,
        skillsRequired: skills,
        roles: roles.filter((role) => role.roleName.trim() !== ""),
      };

      await createProject(payload);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Failed to create project listing");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center px-6 pt-28 pb-16 relative overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 35 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative w-full max-w-2xl bg-bg-secondary border border-border-slate rounded-card p-8 md:p-10 shadow-premium z-10"
      >
        <div className="flex items-center justify-between mb-8 border-b border-border-slate pb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Post a New Project
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Connect with fellow student builders and form your team
            </p>
          </div>
          <Link
            to="/dashboard"
            className="text-xs font-semibold text-gray-400 hover:text-white px-3.5 py-2 rounded-btn border border-border-slate hover:bg-hover-surface transition-all cursor-pointer"
          >
            Cancel
          </Link>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-4 rounded-card bg-danger/10 border border-danger/20 text-danger text-sm flex items-center gap-3"
          >
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{error}</span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300 block">
              Project Title
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className={`w-full bg-card-surface border rounded-input py-3 px-4 text-white text-sm outline-none transition-colors placeholder:text-gray-500 ${
                validationErrors.title
                  ? "border-danger/50 focus:border-danger"
                  : "border-border-slate focus:border-primary"
              }`}
              placeholder="e.g. AI-Powered Study Assistant"
            />
            {validationErrors.title && (
              <p className="text-xs text-danger">{validationErrors.title}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300 block">
              Project Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className={`w-full bg-card-surface border rounded-input py-3 px-4 text-white text-sm outline-none transition-colors placeholder:text-gray-500 resize-none ${
                validationErrors.description
                  ? "border-danger/50 focus:border-danger"
                  : "border-border-slate focus:border-primary"
              }`}
              placeholder="Describe your project, objectives, current progress, and who you are looking for..."
            />
            {validationErrors.description && (
              <p className="text-xs text-danger">{validationErrors.description}</p>
            )}
          </div>

          {/* Grid Category & Team size */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300 block">
                Category
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className={`w-full bg-card-surface border rounded-input py-3 px-4 text-white text-sm outline-none transition-colors ${
                  validationErrors.category
                    ? "border-danger/50 focus:border-danger"
                    : "border-border-slate focus:border-primary"
                }`}
              >
                <option value="">Select Category</option>
                <option value="Hackathon">Hackathon</option>
                <option value="Startup">Startup</option>
                <option value="Open Source">Open Source</option>
                <option value="Research">Research</option>
                <option value="Personal Project">Personal Project</option>
              </select>
              {validationErrors.category && (
                <p className="text-xs text-danger">{validationErrors.category}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300 block">
                Max Team Size
              </label>
              <input
                type="number"
                name="maxTeamSize"
                value={formData.maxTeamSize}
                onChange={handleChange}
                min={1}
                max={50}
                className="w-full bg-card-surface border border-border-slate focus:border-primary rounded-input py-3 px-4 text-white text-sm outline-none transition-colors"
              />
            </div>
          </div>

          {/* Github URL */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300 block">
              GitHub Repository (Optional)
            </label>
            <input
              type="text"
              name="githubUrl"
              value={formData.githubUrl}
              onChange={handleChange}
              className={`w-full bg-card-surface border rounded-input py-3 px-4 text-white text-sm outline-none transition-colors placeholder:text-gray-500 ${
                validationErrors.githubUrl
                  ? "border-danger/50 focus:border-danger"
                  : "border-border-slate focus:border-primary"
              }`}
              placeholder="e.g. github.com/username/project-repo"
            />
            {validationErrors.githubUrl && (
              <p className="text-xs text-danger">{validationErrors.githubUrl}</p>
            )}
          </div>

          {/* Skills tags */}
          <div className="space-y-2 border-t border-border-slate pt-4">
            <label className="text-sm font-medium text-gray-300 block">
              Required Skills
            </label>
            <p className="text-xs text-gray-400">Type a skill (e.g. React, Python) and press Enter to add</p>
            <div className="flex flex-wrap gap-2 mb-2 min-h-[36px] p-2 bg-card-surface border border-border-slate rounded-input">
              {skills.map((skill, index) => (
                <span
                  key={skill}
                  className="text-xs font-medium bg-primary/10 text-primary-light border border-primary/20 px-2.5 py-1 rounded-lg flex items-center gap-1.5"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(index)}
                    className="text-primary-light hover:text-white transition-colors text-[10px] font-black"
                  >
                    ×
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={handleKeyDownSkill}
                className="bg-transparent text-white text-sm outline-none flex-grow min-w-[120px] px-1 py-0.5"
                placeholder={skills.length === 0 ? "Add tech stacks..." : ""}
              />
            </div>
            {validationErrors.skills && (
              <p className="text-xs text-danger">{validationErrors.skills}</p>
            )}
          </div>

          {/* Vacancies / Roles list */}
          <div className="space-y-4 border-t border-border-slate pt-4">
            <div className="flex justify-between items-center">
              <div>
                <label className="text-sm font-medium text-gray-300 block">
                  Vacancies / Open Roles
                </label>
                <p className="text-xs text-gray-400">Specify what roles are currently open on your team</p>
              </div>
              <button
                type="button"
                onClick={handleAddRole}
                className="text-xs font-semibold text-primary hover:text-primary-hover px-3 py-1.5 rounded-btn border border-border-slate hover:bg-hover-surface transition-all cursor-pointer"
              >
                + Add Vacancy Role
              </button>
            </div>

            <div className="space-y-3">
              {roles.map((role, index) => (
                <div key={index} className="flex gap-3 items-center">
                  <input
                    type="text"
                    value={role.roleName}
                    onChange={(e) => handleRoleChange(index, "roleName", e.target.value)}
                    placeholder="e.g. Backend Developer"
                    className="flex-grow bg-card-surface border border-border-slate focus:border-primary rounded-input py-2.5 px-4 text-white text-sm outline-none transition-colors"
                  />
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-400 font-medium">Spots:</label>
                    <input
                      type="number"
                      value={role.vacancies}
                      onChange={(e) => handleRoleChange(index, "vacancies", e.target.value)}
                      min={1}
                      className="w-16 bg-card-surface border border-border-slate focus:border-primary rounded-input py-2.5 px-3 text-white text-sm outline-none text-center"
                    />
                  </div>
                  {roles.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveRole(index)}
                      className="text-xs font-semibold text-danger hover:text-red-300 px-3 py-2.5 rounded-btn border border-danger/20 hover:bg-danger/5 transition-all"
                    >
                      Delete
                    </button>
                  )}
                </div>
              ))}
            </div>
            {validationErrors.roles && (
              <p className="text-xs text-danger">{validationErrors.roles}</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full relative py-3.5 px-4 rounded-btn text-white font-semibold bg-primary hover:bg-primary-hover transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none mt-6 flex items-center justify-center gap-2 cursor-pointer shadow-subtle"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Posting Project...
              </>
            ) : (
              "Create Listing"
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default CreateProject;
