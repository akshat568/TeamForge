import { motion } from "framer-motion";

const steps = [
  {
    number: "01",
    title: "Create your profile",
    description:
      "Sign up and build your student profile. Add your skills, tech stack, interests, and links to GitHub, LinkedIn, and past projects.",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    number: "02",
    title: "Discover or post projects",
    description:
      "Browse hundreds of active projects looking for teammates, or post your own idea and let the right collaborators find you.",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  {
    number: "03",
    title: "Collaborate and build",
    description:
      "Connect with your team, coordinate on tasks, ship your project, and showcase it on your public portfolio for the world to see.",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
  },
];

const HowItWorks = () => {
  return (
    <section className="py-28 px-6 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-purple-600/8 blur-[100px]" />
        <div className="absolute top-1/4 right-1/4 w-[300px] h-[300px] bg-violet-600/8 blur-[80px]" />
      </div>

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.55 }}
          className="text-center mb-20"
        >
          <span className="inline-block text-xs font-semibold text-purple-400 tracking-[0.2em] uppercase mb-4 px-4 py-2 glass rounded-full border border-purple-500/20">
            Getting Started
          </span>
          <h2 className="text-4xl md:text-5xl font-black text-white mt-4 mb-4 tracking-tight">
            How it <span className="gradient-text">works</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-lg mx-auto">
            Go from idea to collaborating team in just three simple steps.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Connector line - desktop only */}
          <div className="hidden lg:block absolute top-16 left-[calc(16.66%-1px)] right-[calc(16.66%-1px)] h-px bg-gradient-to-r from-transparent via-purple-500/40 to-transparent" />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: index * 0.15, ease: "easeOut" }}
                className="flex flex-col items-center text-center lg:items-center group"
              >
                {/* Step badge + icon */}
                <div className="relative mb-8">
                  {/* Outer ring */}
                  <div className="w-32 h-32 rounded-full glass border border-purple-500/20 flex items-center justify-center group-hover:border-purple-400/40 transition-colors duration-300">
                    {/* Inner circle */}
                    <div className="w-20 h-20 rounded-full gradient-bg glow flex items-center justify-center text-white group-hover:scale-105 transition-transform duration-300">
                      {step.icon}
                    </div>
                  </div>
                  {/* Step number */}
                  <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-purple-600 border-2 border-[#0a0a0f] flex items-center justify-center">
                    <span className="text-white text-xs font-bold">
                      {index + 1}
                    </span>
                  </div>
                </div>

                <h3 className="text-white font-bold text-xl mb-3 tracking-tight">
                  {step.title}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* CTA below steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-16 text-center"
        >
          <a
            href="/register"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-base font-semibold text-white gradient-bg glow hover:opacity-90 transition-all duration-300 hover:scale-105"
          >
            Start Building Today
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorks;
