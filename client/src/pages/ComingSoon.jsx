import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const ComingSoon = ({ title = "Coming Soon", subtitle = "This page is under construction. Check back soon." }) => {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 pt-20">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-md"
      >
        {/* Icon */}
        <div className="w-20 h-20 rounded-2xl gradient-bg glow mx-auto mb-6 flex items-center justify-center">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        <h1 className="text-4xl font-black text-white mb-3 tracking-tight">
          {title}
        </h1>
        <p className="text-gray-400 mb-8 leading-relaxed">{subtitle}</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white gradient-bg glow hover:opacity-90 transition-all duration-200 hover:scale-105"
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
