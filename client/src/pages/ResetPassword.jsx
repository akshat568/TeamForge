import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../services/api";

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: ""
  });
  
  const [validationErrors, setValidationErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(5);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (validationErrors[e.target.name]) {
      setValidationErrors({
        ...validationErrors,
        [e.target.name]: ""
      });
    }
    setApiError("");
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.password) {
      errors.password = "New password is required";
    } else if (formData.password.length < 8) {
      errors.password = "Password must be at least 8 characters long";
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = "Please confirm your new password";
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const startCountdown = () => {
    let count = 5;
    const interval = setInterval(() => {
      count -= 1;
      setCountdown(count);
      if (count <= 0) {
        clearInterval(interval);
        navigate("/login");
      }
    }, 1000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);
      setApiError("");
      const res = await api.post(`/auth/reset-password/${token}`, {
        password: formData.password,
        confirmPassword: formData.confirmPassword
      });
      if (res.data.success) {
        setSuccess(true);
        startCountdown();
      }
    } catch (err) {
      setApiError(err.message || "Failed to reset password. The link may have expired.");
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
        className="relative w-full max-w-md bg-bg-secondary border border-border-slate rounded-card p-8 md:p-10 shadow-premium"
      >
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4 group">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center group-hover:scale-105 transition-transform">
              <span className="text-white font-black text-sm">T</span>
            </div>
            <span className="text-lg font-bold text-white tracking-tight">
              Team<span className="text-primary-light">Forge</span>
            </span>
          </Link>
          
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            New Password
          </h2>
          <p className="text-gray-400 text-sm mt-2">
            {!success 
              ? "Set a secure new password for your TeamForge account" 
              : "Password updated successfully"
            }
          </p>
        </div>

        {apiError && (
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
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span>{apiError}</span>
          </motion.div>
        )}

        {!success ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Password input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300 block">
                New Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-500">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </span>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full bg-card-surface border rounded-input py-3 pl-11 pr-4 text-white text-sm outline-none transition-colors placeholder:text-gray-500 ${
                    validationErrors.password
                      ? "border-danger/50 focus:border-danger"
                      : "border-border-slate focus:border-primary"
                  }`}
                  placeholder="Minimum 8 characters"
                  disabled={loading}
                />
              </div>
              {validationErrors.password && (
                <p className="text-xs text-danger mt-1">
                  {validationErrors.password}
                </p>
              )}
            </div>

            {/* Confirm Password input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300 block">
                Confirm New Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-500">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </span>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`w-full bg-card-surface border rounded-input py-3 pl-11 pr-4 text-white text-sm outline-none transition-colors placeholder:text-gray-500 ${
                    validationErrors.confirmPassword
                      ? "border-danger/50 focus:border-danger"
                      : "border-border-slate focus:border-primary"
                  }`}
                  placeholder="Repeat your password"
                  disabled={loading}
                />
              </div>
              {validationErrors.confirmPassword && (
                <p className="text-xs text-danger mt-1">
                  {validationErrors.confirmPassword}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-primary hover:bg-primary-hover text-white rounded-btn text-sm font-bold flex items-center justify-center transition-colors duration-150 shadow-subtle cursor-pointer disabled:opacity-60"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                "Reset Password"
              )}
            </button>
          </form>
        ) : (
          <div className="space-y-6 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-success/10 border border-success/20 flex items-center justify-center text-success text-xl">
              ✓
            </div>
            
            <p className="text-sm text-gray-300">
              Your password has been successfully updated. You will be redirected to the login page automatically in:
            </p>
            <div className="text-3xl font-black text-white font-mono bg-bg-base/50 w-16 h-16 rounded-full border border-border-slate flex items-center justify-center mx-auto">
              {countdown}
            </div>

            <div className="pt-4 border-t border-border-slate/30">
              <Link
                to="/login"
                className="text-sm font-bold text-primary hover:text-primary-hover cursor-pointer transition-colors"
              >
                Go to Login Now
              </Link>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ResetPassword;
