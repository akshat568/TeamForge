import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const ComingSoon = ({ title = "Coming Soon", subtitle = "This feature is currently under active development. Check back soon for updates." }) => {
  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center px-4 sm:px-6 pt-24 pb-16">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-md bg-card-surface border border-border-slate p-8 sm:p-10 rounded-card shadow-card"
      >
        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mx-auto mb-6 flex items-center justify-center text-3xl shadow-inner-soft">
          ⚡
        </div>
        <h1 className="text-3xl font-black text-primary-text mb-2.5 tracking-tight">
          {title}
        </h1>
        <p className="text-muted-text text-xs md:text-sm mb-8 leading-relaxed">
          {subtitle}
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-btn font-bold text-xs text-white bg-primary hover:bg-primary-hover transition-all duration-200 shadow-subtle hover:-translate-y-0.5"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Home
        </Link>
      </motion.div>
    </div>
  );
};

export default ComingSoon;
