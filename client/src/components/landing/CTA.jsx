import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const CTA = () => {
  return (
    <section className="py-20 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="relative rounded-card overflow-hidden bg-card-surface border border-border-slate p-8 md:p-14 text-center shadow-card"
        >
          {/* Subtle warm glow background */}
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-primary/10 rounded-full blur-[70px] pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-primary/5 rounded-full blur-[70px] pointer-events-none" />

          {/* Content */}
          <div className="relative space-y-4 max-w-2xl mx-auto">
            <span className="inline-block text-[10px] font-bold text-primary tracking-widest uppercase px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
              Get Started Today
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-primary-text tracking-tight">
              Ready to assemble your dream builder team?
            </h2>
            <p className="text-muted-text text-sm md:text-base leading-relaxed">
              Join student developers, UI designers, and creators building real products and winning hackathons on TeamForge.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <Link
                to="/register"
                className="w-full sm:w-auto px-7 py-3 rounded-btn font-bold text-xs text-white bg-primary hover:bg-primary-hover transition-all duration-200 shadow-subtle hover:-translate-y-0.5"
              >
                Create Free Account
              </Link>
              <Link
                to="/projects"
                className="w-full sm:w-auto px-7 py-3 rounded-btn font-bold text-xs text-primary-text bg-[#FAF7F2] hover:bg-[#F2ECE1] border border-border-slate transition-all duration-200"
              >
                Explore Projects ↗
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTA;
