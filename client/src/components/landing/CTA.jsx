import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const CTA = () => {
  return (
    <section className="py-28 px-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="relative rounded-3xl overflow-hidden"
        >
          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-800/80 via-violet-700/60 to-purple-900/80" />
          <div className="absolute inset-0 bg-[#0a0a0f]/30" />

          {/* Decorative orbs */}
          <div className="absolute -top-10 -right-10 w-64 h-64 bg-purple-400/20 rounded-full blur-[60px]" />
          <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-violet-500/20 rounded-full blur-[60px]" />

          {/* Grid overlay */}
          <div
            className="absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(to right, rgba(255,255,255,0.5) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />

          {/* Content */}
          <div className="relative px-10 py-16 text-center">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
              Ready to find your dream team?
            </h2>
            <p className="text-purple-200 text-lg mb-10 max-w-lg mx-auto leading-relaxed">
              Join thousands of students already collaborating on TeamForge.
              Your next big project starts here.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/register"
                className="px-8 py-4 rounded-2xl font-semibold text-purple-900 bg-white hover:bg-purple-50 transition-all duration-200 hover:scale-105 shadow-xl"
              >
                Create Free Account
              </Link>
              <Link
                to="/projects"
                className="px-8 py-4 rounded-2xl font-semibold text-white border border-white/30 hover:bg-white/10 transition-all duration-200"
              >
                Browse Projects
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTA;
