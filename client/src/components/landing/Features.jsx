import { motion } from "framer-motion";

const features = [
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    title: "Find Skilled Teammates",
    description:
      "Discover talented students with the exact skills your project needs — from full-stack engineers to UI designers and ML researchers.",
    gradient: "from-violet-600/20 to-purple-600/10",
    border: "hover:border-violet-500/50",
    iconColor: "text-violet-400",
    iconBg: "bg-violet-500/10",
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
    title: "Post Projects",
    description:
      "Share your hackathon idea, open-source initiative, or startup concept and attract the right collaborators instantly.",
    gradient: "from-purple-600/20 to-fuchsia-600/10",
    border: "hover:border-purple-500/50",
    iconColor: "text-purple-400",
    iconBg: "bg-purple-500/10",
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    title: "Skill-based Matching",
    description:
      "Our smart matching surfaces the most relevant teammates based on your tech stack, domain, and project goals.",
    gradient: "from-fuchsia-600/20 to-pink-600/10",
    border: "hover:border-fuchsia-500/50",
    iconColor: "text-fuchsia-400",
    iconBg: "bg-fuchsia-500/10",
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: "Build Strong Teams",
    description:
      "Go from idea to execution with a team that complements your strengths. Ship faster with the right people by your side.",
    gradient: "from-indigo-600/20 to-violet-600/10",
    border: "hover:border-indigo-500/50",
    iconColor: "text-indigo-400",
    iconBg: "bg-indigo-500/10",
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    title: "Showcase Your Portfolio",
    description:
      "Every project you build becomes part of your public portfolio — the proof of work that gets you noticed by recruiters and collaborators.",
    gradient: "from-pink-600/20 to-rose-600/10",
    border: "hover:border-pink-500/50",
    iconColor: "text-pink-400",
    iconBg: "bg-pink-500/10",
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const Features = () => {
  return (
    <section className="py-28 px-6 relative overflow-hidden">
      {/* BG accent */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-purple-700/8 blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.55 }}
          className="text-center mb-16"
        >
          <span className="inline-block text-xs font-semibold text-purple-400 tracking-[0.2em] uppercase mb-4 px-4 py-2 glass rounded-full border border-purple-500/20">
            Why TeamForge
          </span>
          <h2 className="text-4xl md:text-5xl font-black text-white mt-4 mb-4 tracking-tight">
            Everything you need to{" "}
            <span className="gradient-text">find your team</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto leading-relaxed">
            Built specifically for students who want to build real things with real people.
          </p>
        </motion.div>

        {/* Cards grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              variants={cardVariants}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className={`relative group glass rounded-2xl p-7 border border-white/5 ${feature.border} transition-all duration-300 cursor-default overflow-hidden`}
            >
              {/* Card glow background */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl`}
              />

              {/* Content */}
              <div className="relative">
                {/* Icon */}
                <div
                  className={`w-14 h-14 ${feature.iconBg} rounded-2xl flex items-center justify-center mb-5 ${feature.iconColor} transition-transform duration-200 group-hover:scale-110`}
                >
                  {feature.icon}
                </div>

                <h3 className="text-white font-bold text-lg mb-3 tracking-tight">
                  {feature.title}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Features;
