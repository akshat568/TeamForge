import { motion } from "framer-motion";

const features = [
  {
    icon: (
      <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    title: "Find Skilled Teammates",
    description:
      "Discover talented students with the exact skills your project needs — from full-stack engineers to UI designers and ML researchers.",
    tag: "Matchmaking",
  },
  {
    icon: (
      <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
    title: "Post Collaborative Projects",
    description:
      "Share your hackathon idea, open-source initiative, or startup concept and attract the right student collaborators instantly.",
    tag: "Discovery",
  },
  {
    icon: (
      <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    title: "Skill-Based Filtering",
    description:
      "Smart filters surface the most relevant teammates based on specific tech stacks, graduation years, colleges, and availability.",
    tag: "Search",
  },
  {
    icon: (
      <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: "Kanban & Sprints",
    description:
      "Go from idea to execution with integrated agile sprint cycles, real-time board sync, and Gemini AI task estimations.",
    tag: "Workspace",
  },
  {
    icon: (
      <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    title: "Verified Student Portfolio",
    description:
      "Every project built becomes part of your public proof-of-work portfolio with live GitHub sync and teammate contributions.",
    tag: "Showcase",
  },
  {
    icon: (
      <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    title: "Real-Time Chat & Rooms",
    description:
      "Direct messaging and project room threads with typing indicators, online member duration, and document attachments.",
    tag: "Collaboration",
  },
];

const Features = () => {
  return (
    <section className="py-24 px-4 sm:px-6 relative overflow-hidden bg-bg-base">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="inline-block text-[10px] font-bold text-primary tracking-widest uppercase px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
            Platform Capabilities
          </span>
          <h2 className="text-3xl md:text-4xl font-black text-primary-text tracking-tight">
            Engineered for high-performing student teams
          </h2>
          <p className="text-muted-text text-sm md:text-base leading-relaxed">
            Everything you need to find partners, manage deliverables, and showcase your finished software.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.05 }}
              className="bg-card-surface border border-border-slate p-6 rounded-card shadow-subtle hover:border-primary/50 transition-all duration-200 space-y-3 group"
            >
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  {feature.icon}
                </div>
                <span className="text-[10px] uppercase font-bold text-muted-text bg-[#FAF7F2] border border-border-slate px-2 py-0.5 rounded">
                  {feature.tag}
                </span>
              </div>
              <h3 className="font-bold text-primary-text text-base group-hover:text-primary transition-colors">
                {feature.title}
              </h3>
              <p className="text-muted-text text-xs leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
