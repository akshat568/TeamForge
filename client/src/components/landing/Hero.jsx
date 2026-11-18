import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const Hero = () => {
  return (
    <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden pt-28 pb-16 bg-bg-base">
      <div className="relative max-w-5xl mx-auto px-6 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-8 text-xs font-semibold text-charcoal bg-white border border-border-slate shadow-subtle"
        >
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span>TeamForge 2.0 • Join 500+ student builders collaborating now</span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[1.08] mb-6 text-charcoal"
        >
          <span>Build Teams.</span>
          <br />
          <span className="text-primary">Build Projects.</span>
          <br />
          <span>Build Your Future.</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-base sm:text-xl text-text-muted leading-relaxed max-w-2xl mx-auto mb-10"
        >
          Find skilled teammates for hackathons, startup ideas, research work,
          and open-source collaborations — all in one unified platform.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-btn text-sm font-bold text-white bg-primary hover:bg-primary-hover shadow-orange transition-all duration-200 hover:-translate-y-0.5"
          >
            Get Started Free
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
          <Link
            to="/projects"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-btn text-sm font-bold text-charcoal bg-white border border-border-slate hover:bg-hover-surface shadow-subtle transition-all duration-200"
          >
            Browse Projects
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
