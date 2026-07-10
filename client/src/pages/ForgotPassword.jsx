import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../services/api";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [validationError, setValidationError] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setEmail(e.target.value);
    setValidationError("");
    setApiError("");
  };

  const validateForm = () => {
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!email) {
      setValidationError("Email is required");
      return false;
    }
    if (!emailRegex.test(email)) {
      setValidationError("Please enter a valid email address");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);
      setApiError("");
      const res = await api.post("/auth/forgot-password", { email });
      if (res.data.success) {
        setSuccess(true);
      }
    } catch (err) {
      setApiError(err.message || "Something went wrong. Please try again.");
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
            Reset Password
          </h2>
          <p className="text-gray-400 text-sm mt-2">
            {!success 
              ? "Enter your email address and we'll send you a password recovery link" 
              : "Check your inbox"
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
              fill="none; stroke=currentColor"
              viewBox="0 0 24 24"
              stroke="currentColor"
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
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300 block">
                Email Address
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
                      d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.206"
                    />
                  </svg>
                </span>
                <input
                  type="email"
                  name="email"
                  value={email}
                  onChange={handleChange}
                  className={`w-full bg-card-surface border rounded-input py-3 pl-11 pr-4 text-white text-sm outline-none transition-colors placeholder:text-gray-500 ${
                    validationError
                      ? "border-danger/50 focus:border-danger"
                      : "border-border-slate focus:border-primary"
                  }`}
                  placeholder="you@college.edu"
                  disabled={loading}
                />
              </div>
              {validationError && (
                <p className="text-xs text-danger mt-1">
                  {validationError}
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
                "Send Password Reset Link"
              )}
            </button>

            <div className="text-center pt-2">
              <Link
                to="/login"
                className="text-xs text-gray-400 hover:text-white transition-colors"
              >
                Back to Login
              </Link>
            </div>
          </form>
        ) : (
          <div className="space-y-6 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-success/10 border border-success/20 flex items-center justify-center text-success text-xl">
              ✓
            </div>
            
            <div className="space-y-2">
              <p className="text-sm text-gray-300">
                A password reset email has been sent to:
              </p>
              <p className="text-sm font-semibold text-white font-mono bg-bg-base/50 p-2.5 rounded border border-border-slate/40 break-all">
                {email}
              </p>
            </div>

            <p className="text-xs text-gray-400 leading-relaxed">
              If the email does not arrive in a few minutes, check your spam folder or trigger a resend using the action below.
            </p>

            <div className="space-y-3 pt-4 border-t border-border-slate/30">
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="text-sm font-semibold text-primary hover:text-primary-hover cursor-pointer block mx-auto transition-colors disabled:opacity-50"
              >
                {loading ? "Sending..." : "Resend Email"}
              </button>
              
              <Link
                to="/login"
                className="text-xs text-gray-400 hover:text-white transition-colors block"
              >
                Back to Login
              </Link>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
