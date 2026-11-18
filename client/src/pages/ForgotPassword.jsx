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
    <div className="min-h-screen bg-bg-base flex items-center justify-center px-4 sm:px-6 pt-24 pb-16 relative">
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md bg-card-surface border border-border-slate rounded-card p-8 md:p-10 shadow-premium"
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
            Reset Password
          </h2>
          <p className="text-text-muted text-sm mt-1.5">
            Enter your account email to receive a password recovery link
          </p>
        </div>

        {success ? (
          <div className="text-center space-y-4 py-4">
            <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 mx-auto flex items-center justify-center text-2xl">
              ✓
            </div>
            <h3 className="text-base font-bold text-charcoal">Recovery link dispatched</h3>
            <p className="text-xs text-text-muted leading-relaxed">
              If an account with <strong className="text-charcoal">{email}</strong> exists, we've sent password reset instructions to your inbox.
            </p>
            <div className="pt-4">
              <Link
                to="/login"
                className="inline-block px-6 py-2.5 rounded-btn text-xs font-bold bg-primary hover:bg-primary-hover text-white shadow-orange-sm transition-all"
              >
                Back to Sign In
              </Link>
            </div>
          </div>
        ) : (
          <>
            {apiError && (
              <div className="mb-6 p-3.5 rounded-btn bg-red-50 border border-red-200 text-danger text-xs font-semibold flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>{apiError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-charcoal block">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={handleChange}
                  placeholder="you@college.edu"
                  className={`w-full bg-[#F8F5EF] border rounded-input py-2.5 px-3.5 text-charcoal text-sm outline-none transition-colors focus:bg-white placeholder:text-text-muted ${
                    validationError ? "border-danger" : "border-border-slate focus:border-primary"
                  }`}
                />
                {validationError && (
                  <p className="text-xs text-danger font-semibold">{validationError}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-btn text-white font-bold text-sm bg-primary hover:bg-primary-hover shadow-orange transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Sending Link...</span>
                  </>
                ) : (
                  "Send Recovery Link"
                )}
              </button>
            </form>

            <div className="mt-8 text-center border-t border-border-slate pt-6">
              <Link
                to="/login"
                className="text-xs font-bold text-text-muted hover:text-charcoal transition-colors"
              >
                ← Return to Sign In
              </Link>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
