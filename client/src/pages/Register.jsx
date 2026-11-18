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
    <div className="min-h-screen bg-bg-base flex items-center justify-center px-4 sm:px-6 pt-28 pb-16 relative">
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-xl bg-card-surface border border-border-slate rounded-card p-8 md:p-10 shadow-premium"
      >
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-4 group">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-orange-sm group-hover:scale-105 transition-transform">
              <span className="text-white font-black text-lg">TF</span>
            </div>
            <span className="text-xl font-extrabold text-charcoal tracking-tight">
              Team<span className="text-primary">Forge</span>
            </span>
          </Link>
          <h2 className="text-2xl md:text-3xl font-black text-charcoal tracking-tight">
            Create Your Account
          </h2>
          <p className="text-text-muted text-sm mt-1.5">
            Join the student builder network and assemble your project team
          </p>
        </div>

        {/* Errors Block */}
        {(apiError || authError) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-3.5 rounded-btn bg-red-50 border border-red-200 text-danger text-xs font-semibold flex items-center gap-2.5"
          >
            <svg className="w-4 h-4 shrink-0 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{apiError || authError}</span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Section 1: Basic Credentials */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-charcoal block">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full bg-[#F8F5EF] border rounded-input py-2.5 px-3.5 text-charcoal text-sm outline-none transition-colors focus:bg-white placeholder:text-text-muted ${
                  validationErrors.name
                    ? "border-danger focus:border-danger"
                    : "border-border-slate focus:border-primary"
                }`}
                placeholder="Alex Chen"
              />
              {validationErrors.name && (
                <p className="text-xs text-danger font-semibold">{validationErrors.name}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-charcoal block">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full bg-[#F8F5EF] border rounded-input py-2.5 px-3.5 text-charcoal text-sm outline-none transition-colors focus:bg-white placeholder:text-text-muted ${
                  validationErrors.email
                    ? "border-danger focus:border-danger"
                    : "border-border-slate focus:border-primary"
                }`}
                placeholder="alex@college.edu"
              />
              {validationErrors.email && (
                <p className="text-xs text-danger font-semibold">{validationErrors.email}</p>
              )}
            </div>
          </div>

          {/* Section 2: Academic Details */}
          <div className="space-y-4 border-t border-border-slate pt-4">
            <span className="text-xs font-bold text-primary uppercase tracking-wider block">
              Academic Information
            </span>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-charcoal block">
                College / University
              </label>
              <input
                type="text"
                name="college"
                value={formData.college}
                onChange={handleChange}
                className={`w-full bg-[#F8F5EF] border rounded-input py-2.5 px-3.5 text-charcoal text-sm outline-none transition-colors focus:bg-white placeholder:text-text-muted ${
                  validationErrors.college
                    ? "border-danger focus:border-danger"
                    : "border-border-slate focus:border-primary"
                }`}
                placeholder="Stanford University"
              />
              {validationErrors.college && (
                <p className="text-xs text-danger font-semibold">{validationErrors.college}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-charcoal block">
                  Academic Year
                </label>
                <select
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  className={`w-full bg-[#F8F5EF] border rounded-input py-2.5 px-3.5 text-charcoal text-sm outline-none transition-colors focus:bg-white ${
                    validationErrors.year
                      ? "border-danger focus:border-danger"
                      : "border-border-slate focus:border-primary"
                  }`}
                >
                  <option value="" className="text-text-muted">Select Year</option>
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                  <option value="Postgraduate">Postgraduate</option>
                </select>
                {validationErrors.year && (
                  <p className="text-xs text-danger font-semibold">{validationErrors.year}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-charcoal block">
                  Branch / Field of Study
                </label>
                <input
                  type="text"
                  name="branch"
                  value={formData.branch}
                  onChange={handleChange}
                  className={`w-full bg-[#F8F5EF] border rounded-input py-2.5 px-3.5 text-charcoal text-sm outline-none transition-colors focus:bg-white placeholder:text-text-muted ${
                    validationErrors.branch
                      ? "border-danger focus:border-danger"
                      : "border-border-slate focus:border-primary"
                  }`}
                  placeholder="Computer Science"
                />
                {validationErrors.branch && (
                  <p className="text-xs text-danger font-semibold">{validationErrors.branch}</p>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Passwords */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-border-slate pt-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-charcoal block">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full bg-[#F8F5EF] border rounded-input py-2.5 pl-3.5 pr-10 text-charcoal text-sm outline-none transition-colors focus:bg-white placeholder:text-text-muted ${
                    validationErrors.password
                      ? "border-danger focus:border-danger"
                      : "border-border-slate focus:border-primary"
                  }`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-text-muted hover:text-charcoal transition-colors cursor-pointer"
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {validationErrors.password && (
                <p className="text-xs text-danger font-semibold">{validationErrors.password}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-charcoal block">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`w-full bg-[#F8F5EF] border rounded-input py-2.5 pl-3.5 pr-10 text-charcoal text-sm outline-none transition-colors focus:bg-white placeholder:text-text-muted ${
                    validationErrors.confirmPassword
                      ? "border-danger focus:border-danger"
                      : "border-border-slate focus:border-primary"
                  }`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-text-muted hover:text-charcoal transition-colors cursor-pointer"
                >
                  {showConfirmPassword ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {validationErrors.confirmPassword && (
                <p className="text-xs text-danger font-semibold">{validationErrors.confirmPassword}</p>
              )}
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-btn text-white font-bold text-sm bg-primary hover:bg-primary-hover shadow-orange transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none mt-4 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Creating Account...</span>
              </>
            ) : (
              "Complete Free Registration"
            )}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-border-slate pt-6">
          <p className="text-sm text-text-muted">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-bold text-primary hover:text-primary-hover transition-colors"
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
