import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { applyToProject } from "../../services/applicationService";

const ApplyModal = ({ project, isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    roleId: "",
    introduction: "",
    whyJoin: "",
    githubUrl: "",
  });

  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const { title, roles = [] } = project;

  // Filter only open roles with vacancies
  const openRoles = roles.filter((role) => role.status === "open" && role.vacancies > 0);

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

  const handleAddSkill = (e) => {
    e.preventDefault();
    const clean = skillInput.trim();
    if (clean && !skills.includes(clean)) {
      setSkills([...skills, clean]);
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

  const handleRemoveSkill = (idxToRemove) => {
    setSkills(skills.filter((_, idx) => idx !== idxToRemove));
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.roleId) errors.roleId = "Please select a target role";
    if (!formData.introduction.trim()) errors.introduction = "Short introduction is required";
    if (!formData.whyJoin.trim()) errors.whyJoin = "Please describe why you want to join";
    if (skills.length === 0) errors.skills = "Please list at least one relevant skill";

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
        projectId: project._id,
        roleId: formData.roleId,
        introduction: formData.introduction,
        whyJoin: formData.whyJoin,
        skills,
        githubUrl: formData.githubUrl,
      };

      const res = await applyToProject(payload);
      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setError(res.message || "Failed to submit application");
      }
    } catch (err) {
      setError(err.message || "Failed to submit application");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-[#0f172a]/80 backdrop-blur-sm"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="relative w-full max-w-lg bg-bg-secondary border border-border-slate rounded-modal p-6 md:p-8 shadow-premium z-10 overflow-y-auto max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-border-slate">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Apply to Join Team</h2>
              <p className="text-xs text-gray-400 mt-0.5">Project: {title}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-xl font-medium cursor-pointer"
            >
              ×
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-danger/10 border border-danger/20 text-danger text-xs rounded-card flex items-center gap-2">
              <svg className="w-4.5 h-4.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Target Role Dropdown */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-300 block">Select Role</label>
              <select
                name="roleId"
                value={formData.roleId}
                onChange={handleChange}
                className={`w-full bg-card-surface border rounded-input py-2.5 px-3 text-white text-sm outline-none transition-colors ${
                  validationErrors.roleId
                    ? "border-danger/50 focus:border-danger"
                    : "border-border-slate focus:border-primary"
                }`}
              >
                <option value="">Select an open position...</option>
                {openRoles.map((role) => (
                  <option key={role._id} value={role._id}>
                    {role.roleName} ({role.vacancies} spot{role.vacancies > 1 ? "s" : ""} left)
                  </option>
                ))}
              </select>
              {validationErrors.roleId && (
                <p className="text-[11px] text-danger">{validationErrors.roleId}</p>
              )}
            </div>

            {/* Introduction */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-300 block">Short Introduction</label>
              <textarea
                name="introduction"
                value={formData.introduction}
                onChange={handleChange}
                rows={2}
                maxLength={300}
                placeholder="Introduce yourself, your background, or what you're studying..."
                className={`w-full bg-card-surface border rounded-input py-2.5 px-3 text-white text-sm outline-none transition-colors resize-none placeholder:text-gray-500 ${
                  validationErrors.introduction
                    ? "border-danger/50 focus:border-danger"
                    : "border-border-slate focus:border-primary"
                }`}
              />
              <div className="flex justify-between items-center text-[10px] text-gray-400 px-1">
                <span>{validationErrors.introduction && <span className="text-danger">{validationErrors.introduction}</span>}</span>
                <span>{formData.introduction.length}/300</span>
              </div>
            </div>

            {/* Why Join */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-300 block">Why do you want to join this project?</label>
              <textarea
                name="whyJoin"
                value={formData.whyJoin}
                onChange={handleChange}
                rows={3}
                maxLength={500}
                placeholder="Share why this project interests you and how you can contribute..."
                className={`w-full bg-card-surface border rounded-input py-2.5 px-3 text-white text-sm outline-none transition-colors resize-none placeholder:text-gray-500 ${
                  validationErrors.whyJoin
                    ? "border-danger/50 focus:border-danger"
                    : "border-border-slate focus:border-primary"
                }`}
              />
              <div className="flex justify-between items-center text-[10px] text-gray-400 px-1">
                <span>{validationErrors.whyJoin && <span className="text-danger">{validationErrors.whyJoin}</span>}</span>
                <span>{formData.whyJoin.length}/500</span>
              </div>
            </div>

            {/* Skills tag input */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-300 block">Relevant Skills</label>
              <div className="flex flex-wrap gap-1.5 p-1.5 bg-card-surface border border-border-slate rounded-input min-h-[38px]">
                {skills.map((skill, index) => (
                  <span
                    key={skill}
                    className="text-[10px] font-medium bg-primary/10 text-primary-light border border-primary/20 px-2 py-0.5 rounded-md flex items-center gap-1"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(index)}
                      className="text-primary-light hover:text-white text-[8px] font-bold"
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
                  className="bg-transparent text-white text-xs outline-none flex-grow min-w-[80px] px-1 py-0.5"
                  placeholder={skills.length === 0 ? "React, Python..." : ""}
                />
              </div>
              {validationErrors.skills && (
                <p className="text-[11px] text-danger">{validationErrors.skills}</p>
              )}
            </div>

            {/* GitHub Profile URL */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-300 block">GitHub Profile Link (Optional)</label>
              <input
                type="text"
                name="githubUrl"
                value={formData.githubUrl}
                onChange={handleChange}
                placeholder="github.com/your-username"
                className="w-full bg-card-surface border border-border-slate focus:border-primary rounded-input py-2.5 px-3 text-white text-sm outline-none transition-colors placeholder:text-gray-500"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-3">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 py-2.5 px-4 rounded-btn text-xs font-semibold text-gray-300 hover:text-white border border-border-slate hover:bg-hover-surface transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 px-4 rounded-btn text-xs font-semibold text-white bg-primary hover:bg-primary-hover shadow-subtle transition-all hover:scale-[1.01] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {loading ? "Submitting..." : "Submit Application"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ApplyModal;
