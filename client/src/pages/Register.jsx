import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";

const Register = () => {
  const { register, isAuthenticated, error: authError, clearError } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    college: "",
    year: "",
    branch: "",
  });

  const [validationErrors, setValidationErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  // Clear errors and redirect if authenticated
  useEffect(() => {
    clearError();
    setApiError("");
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Clear validation error for field
    if (validationErrors[e.target.name]) {
      setValidationErrors({
        ...validationErrors,
        [e.target.name]: "",
      });
    }
    setApiError("");
  };

  const validateForm = () => {
    const errors = {};
    const emailRegex = /^\S+@\S+\.\S+$/;

    if (!formData.name.trim()) errors.name = "Full name is required";
    
    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!emailRegex.test(formData.email)) {
      errors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      errors.password = "Password is required";
    } else if (formData.password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    if (!formData.college.trim()) errors.college = "College name is required";
    if (!formData.year) errors.year = "Academic year is required";
    if (!formData.branch.trim()) errors.branch = "Branch / Field of study is required";

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);
      setApiError("");
      
      const { confirmPassword, ...registerPayload } = formData;
      await register(registerPayload);
      navigate("/dashboard");
    } catch (err) {
      setApiError(err.message || "Registration failed. Please check your inputs.");
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
        className="relative w-full max-w-xl bg-bg-secondary border border-border-slate rounded-card p-8 md:p-10 shadow-premium"
      >
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4 group">
            <div className="w-8 h-8 rounded-xl gradient-bg flex items-center justify-center group-hover:scale-105 transition-transform">
              <span className="text-white font-black text-sm">T</span>
            </div>
            <span className="text-lg font-bold text-white tracking-tight">
              Team<span className="gradient-text">Forge</span>
            </span>
          </Link>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            Create your account
          </h2>
          <p className="text-gray-400 text-sm mt-2">
            Join the student builder network and start collaborating
          </p>
        </div>

        {/* Errors Block */}
        {(apiError || authError) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-4 rounded-card bg-danger/10 border border-danger/20 text-danger text-sm flex items-center gap-3"
          >
            <svg
              className="w-5 h-5 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span>{apiError || authError}</span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Basic Credentials */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300 block">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full bg-card-surface border rounded-input py-3 px-4 text-white text-sm outline-none transition-colors placeholder:text-gray-500 ${
                  validationErrors.name
                    ? "border-danger/50 focus:border-danger"
                    : "border-border-slate focus:border-primary"
                }`}
                placeholder="John Doe"
              />
              {validationErrors.name && (
                <p className="text-xs text-danger">{validationErrors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300 block">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full bg-card-surface border rounded-input py-3 px-4 text-white text-sm outline-none transition-colors placeholder:text-gray-500 ${
                  validationErrors.email
                    ? "border-danger/50 focus:border-danger"
                    : "border-border-slate focus:border-primary"
                }`}
                placeholder="john@college.edu"
              />
              {validationErrors.email && (
                <p className="text-xs text-danger">{validationErrors.email}</p>
              )}
            </div>
          </div>

          {/* Section 2: College & Academic Details */}
          <div className="space-y-4 border-t border-border-slate pt-4">
            <h3 className="text-xs font-semibold text-primary-light uppercase tracking-wider mb-2">
              Academic Information
            </h3>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300 block">
                College / University
              </label>
              <input
                type="text"
                name="college"
                value={formData.college}
                onChange={handleChange}
                className={`w-full bg-card-surface border rounded-input py-3 px-4 text-white text-sm outline-none transition-colors placeholder:text-gray-500 ${
                  validationErrors.college
                    ? "border-danger/50 focus:border-danger"
                    : "border-border-slate focus:border-primary"
                }`}
                placeholder="Massachusetts Institute of Technology"
              />
              {validationErrors.college && (
                <p className="text-xs text-danger">{validationErrors.college}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300 block">
                  Academic Year
                </label>
                <select
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  className={`w-full bg-card-surface border rounded-input py-3 px-4 text-white text-sm outline-none transition-colors ${
                    validationErrors.year
                      ? "border-danger/50 focus:border-danger"
                      : "border-border-slate focus:border-primary"
                  }`}
                >
                  <option value="" className="text-gray-500">Select Year</option>
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                  <option value="Postgraduate">Postgraduate</option>
                </select>
                {validationErrors.year && (
                  <p className="text-xs text-danger">{validationErrors.year}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300 block">
                  Branch / Field of Study
                </label>
                <input
                  type="text"
                  name="branch"
                  value={formData.branch}
                  onChange={handleChange}
                  className={`w-full bg-card-surface border rounded-input py-3 px-4 text-white text-sm outline-none transition-colors placeholder:text-gray-500 ${
                    validationErrors.branch
                      ? "border-danger/50 focus:border-danger"
                      : "border-border-slate focus:border-primary"
                  }`}
                  placeholder="Computer Science & Engineering"
                />
                {validationErrors.branch && (
                  <p className="text-xs text-danger">{validationErrors.branch}</p>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Passwords */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-border-slate pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300 block">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full bg-card-surface border rounded-input py-3 pl-4 pr-10 text-white text-sm outline-none transition-colors placeholder:text-gray-500 ${
                    validationErrors.password
                      ? "border-danger/50 focus:border-danger"
                      : "border-border-slate focus:border-primary"
                  }`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {validationErrors.password && (
                <p className="text-xs text-danger">{validationErrors.password}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300 block">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`w-full bg-card-surface border rounded-input py-3 pl-4 pr-10 text-white text-sm outline-none transition-colors placeholder:text-gray-500 ${
                    validationErrors.confirmPassword
                      ? "border-danger/50 focus:border-danger"
                      : "border-border-slate focus:border-primary"
                  }`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
                >
                  {showConfirmPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {validationErrors.confirmPassword && (
                <p className="text-xs text-danger">{validationErrors.confirmPassword}</p>
              )}
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full relative py-3.5 px-4 rounded-btn text-white font-semibold bg-primary hover:bg-primary-hover transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none mt-4 flex items-center justify-center gap-2 cursor-pointer shadow-subtle"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Creating Account...
              </>
            ) : (
              "Sign Up"
            )}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-border-slate pt-6">
          <p className="text-sm text-gray-400">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-medium text-primary hover:text-primary-hover transition-colors"
            >
              Sign In
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
