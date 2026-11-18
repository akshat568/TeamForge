import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { createProject } from "../services/projectService";

const categories = ["Hackathon", "Startup", "Open Source", "Research", "Personal Project"];

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
      errors.skills = "Please add at least one required skill tag";
    }

    if (formData.githubUrl.trim()) {
      const gitRegex = /^(https?:\/\/)?(www\.)?github\.com\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+\/?$/;
      if (!gitRegex.test(formData.githubUrl.trim())) {
        errors.githubUrl = "Please provide a valid GitHub repository URL (e.g. github.com/user/repo)";
      }
    }

    const invalidRoles = roles.some((role) => !role.roleName.trim() || role.vacancies < 1);
    if (invalidRoles) {
      errors.roles = "All vacancy roles must have a name and at least 1 spot";
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
    <div className="min-h-screen bg-bg-base text-text-primary pt-28 pb-20 px-4 sm:px-6 relative">
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-2xl mx-auto bg-card-surface border border-border-slate rounded-card p-8 md:p-10 shadow-premium"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-6 border-b border-border-slate mb-6">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-widest text-primary bg-primary-tint px-3 py-1 rounded-full border border-primary/20">
              New Initiative
            </span>
            <h1 className="text-2xl md:text-3xl font-black text-charcoal tracking-tight">
              Post a Project Listing
            </h1>
            <p className="text-xs md:text-sm text-text-muted">
              Assemble student developers and designers for your next build
            </p>
          </div>
          <Link
            to="/dashboard"
            className="text-xs font-bold text-text-muted hover:text-charcoal bg-[#F8F5EF] px-3 py-1.5 rounded-btn border border-border-slate transition-colors"
          >
            Cancel
          </Link>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-btn bg-red-50 border border-red-200 text-danger text-xs font-semibold flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Overview */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-charcoal block">
                Project Title <span className="text-primary">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. AI-Powered Campus Shuttle Tracker"
                className={`w-full bg-[#F8F5EF] border rounded-input py-2.5 px-3.5 text-charcoal text-sm outline-none transition-colors focus:bg-white placeholder:text-text-muted ${
                  validationErrors.title ? "border-danger focus:border-danger" : "border-border-slate focus:border-primary"
                }`}
              />
              {validationErrors.title && (
                <p className="text-xs text-danger font-semibold">{validationErrors.title}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-charcoal block">
                  Project Category <span className="text-primary">*</span>
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className={`w-full bg-[#F8F5EF] border rounded-input py-2.5 px-3.5 text-charcoal text-sm outline-none transition-colors focus:bg-white ${
                    validationErrors.category ? "border-danger focus:border-danger" : "border-border-slate focus:border-primary"
                  }`}
                >
                  <option value="">Select Category...</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                {validationErrors.category && (
                  <p className="text-xs text-danger font-semibold">{validationErrors.category}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-charcoal block">
                  Target Team Size
                </label>
                <input
                  type="number"
                  name="maxTeamSize"
                  min="2"
                  max="20"
                  value={formData.maxTeamSize}
                  onChange={handleChange}
                  className="w-full bg-[#F8F5EF] border border-border-slate focus:border-primary focus:bg-white rounded-input py-2.5 px-3.5 text-charcoal text-sm outline-none transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-charcoal block">
                Project Description <span className="text-primary">*</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                placeholder="Explain the problem you are solving, your approach, tech stack, and what you are looking for in teammates..."
                className={`w-full bg-[#F8F5EF] border rounded-input py-2.5 px-3.5 text-charcoal text-sm outline-none transition-colors focus:bg-white resize-none placeholder:text-text-muted ${
                  validationErrors.description ? "border-danger focus:border-danger" : "border-border-slate focus:border-primary"
                }`}
              />
              {validationErrors.description && (
                <p className="text-xs text-danger font-semibold">{validationErrors.description}</p>
              )}
            </div>
          </div>

          {/* Section 2: Skills & Tech Stack */}
          <div className="space-y-2 border-t border-border-slate pt-5">
            <label className="text-xs font-bold uppercase tracking-wider text-charcoal block">
              Required Skills & Technologies <span className="text-primary">*</span>
            </label>
            <div className="flex flex-wrap gap-1.5 p-2 bg-[#F8F5EF] border border-border-slate rounded-input min-h-[46px] focus-within:bg-white focus-within:border-primary">
              {skills.map((skill, index) => (
                <span
                  key={skill}
                  className="text-xs font-semibold bg-white text-charcoal border border-border-slate px-2.5 py-0.5 rounded-md flex items-center gap-1.5 shadow-subtle"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(index)}
                    className="text-text-muted hover:text-danger text-xs font-bold cursor-pointer"
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
                placeholder={skills.length === 0 ? "Type skill and press Enter (e.g. React, Python, UI/UX)..." : "Add more..."}
                className="bg-transparent text-charcoal text-xs outline-none flex-grow min-w-[120px] px-1 py-1"
              />
            </div>
            {validationErrors.skills && (
              <p className="text-xs text-danger font-semibold">{validationErrors.skills}</p>
            )}
          </div>

          {/* Section 3: Open Roles */}
          <div className="space-y-3 border-t border-border-slate pt-5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-charcoal block">
                Open Role Vacancies
              </label>
              <button
                type="button"
                onClick={handleAddRole}
                className="text-xs font-bold text-primary hover:text-primary-hover transition-colors flex items-center gap-1 cursor-pointer"
              >
                + Add Another Role
              </button>
            </div>

            <div className="space-y-2.5">
              {roles.map((role, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-[#FAF8F4] p-3 rounded-card border border-border-slate">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="e.g. Full-Stack Developer, UI/UX Designer"
                      value={role.roleName}
                      onChange={(e) => handleRoleChange(idx, "roleName", e.target.value)}
                      className="w-full bg-white border border-border-slate focus:border-primary rounded-input py-2 px-3 text-charcoal text-xs outline-none"
                    />
                  </div>
                  <div className="w-24">
                    <input
                      type="number"
                      min="1"
                      max="10"
                      title="Available spots"
                      value={role.vacancies}
                      onChange={(e) => handleRoleChange(idx, "vacancies", e.target.value)}
                      className="w-full bg-white border border-border-slate focus:border-primary rounded-input py-2 px-2 text-center text-charcoal text-xs outline-none"
                    />
                  </div>
                  {roles.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveRole(idx)}
                      className="text-danger hover:text-red-700 p-1.5 text-xs font-bold cursor-pointer"
                      title="Remove Role"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
            {validationErrors.roles && (
              <p className="text-xs text-danger font-semibold">{validationErrors.roles}</p>
            )}
          </div>

          {/* Section 4: Repository link */}
          <div className="space-y-1.5 border-t border-border-slate pt-5">
            <label className="text-xs font-bold uppercase tracking-wider text-charcoal block">
              GitHub Repository URL (Optional)
            </label>
            <input
              type="text"
              name="githubUrl"
              value={formData.githubUrl}
              onChange={handleChange}
              placeholder="https://github.com/organization/repository"
              className={`w-full bg-[#F8F5EF] border rounded-input py-2.5 px-3.5 text-charcoal text-sm outline-none transition-colors focus:bg-white placeholder:text-text-muted ${
                validationErrors.githubUrl ? "border-danger focus:border-danger" : "border-border-slate focus:border-primary"
              }`}
            />
            {validationErrors.githubUrl && (
              <p className="text-xs text-danger font-semibold">{validationErrors.githubUrl}</p>
            )}
          </div>

          {/* Submit */}
          <div className="pt-4 border-t border-border-slate flex gap-4">
            <Link
              to="/dashboard"
              className="flex-1 py-3 px-4 rounded-btn text-xs font-bold text-text-secondary hover:text-charcoal bg-[#F8F5EF] hover:bg-white border border-border-slate text-center transition-all"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 px-4 rounded-btn text-xs font-bold text-white bg-primary hover:bg-primary-hover shadow-orange transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Publishing Project...</span>
                </>
              ) : (
                "Publish Project Listing"
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default CreateProject;
