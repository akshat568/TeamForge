import { motion } from "framer-motion";

const steps = [
  {
    number: "01",
    title: "Create your student profile",
    description:
      "Sign up with your college email. Add your programming languages, frameworks, interests, and link your GitHub and LinkedIn.",
    icon: (
      <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    number: "02",
    title: "Discover or pitch projects",
    description:
      "Browse active hackathon ideas seeking teammates, or post your open-source concept with specific skill vacancies.",
    icon: (
      <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  {
    number: "03",
    title: "Collaborate and deliver",
    description:
      "Manage tasks in agile sprints, sync GitHub commits, chat in real time, and build your shared proof of work.",
    icon: (
      <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
  },
];

const HowItWorks = () => {
  return (
    <section className="py-24 px-4 sm:px-6 relative overflow-hidden bg-[#FAF7F2]/60 border-y border-border-slate">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="inline-block text-[10px] font-bold text-primary tracking-widest uppercase px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
            Getting Started
          </span>
          <h2 className="text-3xl md:text-4xl font-black text-primary-text tracking-tight">
            How TeamForge works
          </h2>
          <p className="text-muted-text text-sm md:text-base leading-relaxed">
            From initial campus idea to shipping software in three streamlined steps.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className="bg-card-surface border border-border-slate p-8 rounded-card shadow-subtle flex flex-col items-center text-center space-y-4 hover:border-primary/40 transition-colors"
            >
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-inner-soft">
                  {step.icon}
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-white text-[10px] font-black flex items-center justify-center shadow-subtle">
                  {index + 1}
                </div>
              </div>

              <h3 className="text-primary-text font-black text-lg tracking-tight">
                {step.title}
              </h3>
              <p className="text-muted-text text-xs leading-relaxed max-w-xs">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
