import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-purple-700/15 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 left-1/4 w-[350px] h-[350px] bg-violet-600/10 rounded-full blur-[80px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-purple-500/10 rounded-full blur-[80px]" />
        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(124,58,237,0.5) 1px, transparent 1px), linear-gradient(to right, rgba(124,58,237,0.5) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <div className="relative max-w-5xl mx-auto px-6 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-8 text-xs font-medium text-purple-300 border border-purple-500/25"
        >
          <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
          Now in Beta — Join 500+ students building together
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[1.08] mb-6"
        >
          <span className="text-white">Build Teams.</span>
          <br />
          <span className="gradient-text">Build Projects.</span>
          <br />
          <span className="text-white">Build Your Future.</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="text-lg sm:text-xl text-gray-400 leading-relaxed max-w-2xl mx-auto mb-10"
        >
          Find skilled teammates for hackathons, startup ideas, research work,
          and open-source collaborations — all in one platform.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            to="/register"
            className="group relative inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-base font-semibold text-white gradient-bg glow transition-all duration-300 hover:scale-105 hover:shadow-purple-500/40 hover:shadow-2xl"
          >
            Get Started
            <svg
              className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </Link>
          <Link
            to="/projects"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-base font-semibold text-gray-300 glass border border-purple-500/20 transition-all duration-300 hover:text-white hover:border-purple-400/40 hover:bg-white/5"
          >
            Browse Projects
          </Link>
        </motion.div>

        {/* Social Proof */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.75 }}
          className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10 text-sm text-gray-500"
        >
          {[
            { value: "500+", label: "Students" },
            { value: "120+", label: "Projects" },
            { value: "50+", label: "Teams Formed" },
          ].map((stat) => (
            <div key={stat.label} className="flex flex-col items-center gap-1">
              <span className="text-2xl font-bold gradient-text">{stat.value}</span>
              <span className="text-gray-500 text-xs tracking-wide uppercase">
                {stat.label}
              </span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
