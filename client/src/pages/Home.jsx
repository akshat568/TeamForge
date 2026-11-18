import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const Home = () => {
  const features = [
    {
      icon: (
        <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      tag: "Kanban Board",
      title: "Workspace Sprint Boards",
      description: "Collaborate in real time with teammates. Manage sprint tasks, reorder backlog columns, and monitor delivery progress."
    },
    {
      icon: (
        <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
      tag: "Discovery",
      title: "Smart Project Discovery",
      description: "Discover active campus hackathons, open source initiatives, and startup projects filtered by skills and open roles."
    },
    {
      icon: (
        <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      tag: "Real-Time Chat",
      title: "Real-Time Team Messaging",
      description: "Direct messaging and project room discussions with live presence, typing statuses, and instant file link sharing."
    },
    {
      icon: (
        <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      tag: "AI Assistant",
      title: "Gemini AI Sprint Copilot",
      description: "Auto-generate task backlogs, write sprint briefs, calculate project health metrics, and get instant architectural advice."
    },
    {
      icon: (
        <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      ),
      tag: "Git Integration",
      title: "GitHub Repository Sync",
      description: "Link repositories directly to your workspace. Inspect branches, commit streams, pull requests, and contributor activity."
    },
    {
      icon: (
        <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
        </svg>
      ),
      tag: "Storage",
      title: "Secure Deliverable Storage",
      description: "Upload code specifications, pitch decks, Figma previews, and design assets directly to organized Cloudinary buckets."
    }
  ];

  const steps = [
    {
      number: "01",
      title: "Pitch or Discover",
      description: "Post a hackathon idea with open vacancies or browse curated student listings looking for your specific skill stack."
    },
    {
      number: "02",
      title: "Assemble the Team",
      description: "Review incoming student applications, inspect verified GitHub profiles, and confirm members with one click."
    },
    {
      number: "03",
      title: "Sprint in Workspace",
      description: "Organize Kanban cards, track sprint burndown, coordinate branches, and chat live with team members."
    },
    {
      number: "04",
      title: "Ship & Showcase",
      description: "Deliver prototypes on schedule, archive project milestones, and compile verifiable engineering portfolio links."
    }
  ];

  return (
    <div className="bg-bg-base text-text-primary pt-28 pb-16 overflow-hidden min-h-screen">
      
      {/* ─── ANNOUNCEMENT PILL ────────────────────────────────────────────── */}
      <div className="flex justify-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white border border-border-slate text-xs font-semibold text-charcoal shadow-subtle hover:border-primary/40 transition-colors"
        >
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-primary font-bold">TeamForge 2.0</span>
          <span className="text-border-slate font-light">|</span>
          <span className="text-text-muted">The Premium Collaboration Platform for Student Builders</span>
        </motion.div>
      </div>

      {/* ─── SECTION 1: HERO SECTION ───────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto py-8 md:py-16 px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center border-b border-border-slate/60 pb-20">
        
        {/* HERO LEFT SIDE */}
        <div className="lg:col-span-6 space-y-6 text-left">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-4"
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.08] text-charcoal">
              Build Projects.<br />
              Find Teammates.<br />
              <span className="text-primary">Ship Faster.</span>
            </h1>
            <p className="text-text-secondary text-base sm:text-lg font-normal leading-relaxed max-w-xl">
              TeamForge unites student developers, designers, and founders into high-performing teams. Assemble hackathon squads, manage sprints, synchronize GitHub repos, and build a verified portfolio.
            </p>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="flex flex-wrap gap-3.5 pt-2"
          >
            <Link
              to="/register"
              className="h-12 px-7 bg-primary hover:bg-primary-hover text-white rounded-btn text-sm font-bold flex items-center justify-center gap-2 shadow-orange transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              <span>Get Started Free</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
            <Link
              to="/projects"
              className="h-12 px-7 bg-white hover:bg-hover-surface border border-border-slate hover:border-charcoal/30 text-charcoal rounded-btn text-sm font-bold flex items-center justify-center gap-2 shadow-subtle transition-all duration-200"
            >
              <span>Explore Projects</span>
              <svg className="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </Link>
          </motion.div>

          {/* Tech Stack Strip */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="pt-6 border-t border-border-slate/80 space-y-2"
          >
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted block">
              Powered by modern engineering
            </span>
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-text-secondary">
              <span className="px-2.5 py-1 rounded-md bg-white border border-border-slate">React 19</span>
              <span className="px-2.5 py-1 rounded-md bg-white border border-border-slate">Node.js</span>
              <span className="px-2.5 py-1 rounded-md bg-white border border-border-slate">MongoDB</span>
              <span className="px-2.5 py-1 rounded-md bg-white border border-border-slate">Socket.IO</span>
              <span className="px-2.5 py-1 rounded-md bg-white border border-border-slate text-primary font-bold">Gemini AI</span>
              <span className="px-2.5 py-1 rounded-md bg-white border border-border-slate">Cloudinary</span>
            </div>
          </motion.div>
        </div>

        {/* HERO RIGHT SIDE: INTERACTIVE SAAS WORKSPACE PREVIEW */}
        <div className="lg:col-span-6 flex justify-center lg:justify-end">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full max-w-lg bg-card-surface border border-border-slate rounded-card p-6 shadow-premium relative space-y-5"
          >
            {/* Top Workspace Header Bar */}
            <div className="flex items-center justify-between pb-3.5 border-b border-border-slate">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-primary-tint flex items-center justify-center text-primary font-bold text-xs">
                  ⚡
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-charcoal leading-none">SmartCampus AI</h4>
                  <span className="text-[10px] text-text-muted">Active Sprint #2 • Hackathon Track</span>
                </div>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-bold text-emerald-700">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Live Synced</span>
              </div>
            </div>

            {/* Simulated Live Kanban Column Cards */}
            <div className="grid grid-cols-2 gap-3">
              {/* Task 1 */}
              <div className="bg-[#FAF8F4] border border-border-slate rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary-tint text-primary border border-primary/20">
                    High Priority
                  </span>
                  <span className="text-[10px] text-text-muted font-medium">Due Today</span>
                </div>
                <h5 className="text-xs font-bold text-charcoal">Design auth state & JWT token rotation</h5>
                <div className="flex items-center justify-between pt-1">
                  <div className="w-5 h-5 rounded-full bg-charcoal text-white text-[9px] font-bold flex items-center justify-center">
                    JD
                  </div>
                  <span className="text-[9px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                    In Progress
                  </span>
                </div>
              </div>

              {/* Task 2 */}
              <div className="bg-[#FAF8F4] border border-border-slate rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200">
                    Frontend
                  </span>
                  <span className="text-[10px] text-text-muted font-medium">2d left</span>
                </div>
                <h5 className="text-xs font-bold text-charcoal">Implement real-time Kanban drag sockets</h5>
                <div className="flex items-center justify-between pt-1">
                  <div className="w-5 h-5 rounded-full bg-primary text-white text-[9px] font-bold flex items-center justify-center">
                    AK
                  </div>
                  <span className="text-[9px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                    Review
                  </span>
                </div>
              </div>
            </div>

            {/* Active Sprint Progress Gauge */}
            <div className="bg-[#FAF8F4] border border-border-slate rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-charcoal flex items-center gap-1.5">
                  <span className="text-primary font-bold">Sprint Velocity</span>
                  <span className="text-text-muted font-normal">• 12 of 16 tasks closed</span>
                </span>
                <span className="text-primary font-bold">75%</span>
              </div>
              <div className="w-full bg-white h-2 rounded-full overflow-hidden border border-border-slate">
                <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: "75%" }} />
              </div>
            </div>

            {/* GitHub Stream simulation box */}
            <div className="bg-[#242424] text-white p-3.5 rounded-xl font-mono text-[11px] space-y-1 shadow-subtle">
              <div className="flex items-center justify-between text-gray-400 text-[10px] pb-1 border-b border-white/10">
                <span>🐙 github.com/teamforge/smart-campus</span>
                <span className="text-emerald-400">main</span>
              </div>
              <p className="text-gray-300">$ git merge origin/feature-ai-assistant</p>
              <p className="text-emerald-400">✔ Merge successful: 3 commits synced without conflicts</p>
            </div>

          </motion.div>
        </div>

      </div>

      {/* ─── SOCIAL PROOF / METRICS STRIP ──────────────────────────────────── */}
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 border-b border-border-slate/60">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="space-y-1 p-4 rounded-card bg-white border border-border-slate shadow-subtle">
            <span className="text-3xl font-black text-charcoal">500+</span>
            <p className="text-xs font-bold uppercase tracking-wider text-text-muted">Student Builders</p>
          </div>
          <div className="space-y-1 p-4 rounded-card bg-white border border-border-slate shadow-subtle">
            <span className="text-3xl font-black text-primary">140+</span>
            <p className="text-xs font-bold uppercase tracking-wider text-text-muted">Projects Launched</p>
          </div>
          <div className="space-y-1 p-4 rounded-card bg-white border border-border-slate shadow-subtle">
            <span className="text-3xl font-black text-charcoal">45+</span>
            <p className="text-xs font-bold uppercase tracking-wider text-text-muted">Campus Hackathons</p>
          </div>
          <div className="space-y-1 p-4 rounded-card bg-white border border-border-slate shadow-subtle">
            <span className="text-3xl font-black text-primary">98%</span>
            <p className="text-xs font-bold uppercase tracking-wider text-text-muted">Team Match Rate</p>
          </div>
        </div>
      </div>

      {/* ─── SECTION 2: FEATURE GRID ───────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto py-20 px-4 sm:px-6 lg:px-8 border-b border-border-slate/60">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-14">
          <span className="text-xs font-bold uppercase tracking-widest text-primary bg-primary-tint px-3 py-1 rounded-full border border-primary/20">
            Platform Capabilities
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-charcoal tracking-tight">
            Engineered for Student Collaboration
          </h2>
          <p className="text-text-muted text-base leading-relaxed">
            Eliminate messy WhatsApp threads and lost Google Drive links. Run your projects on a dedicated, professional collaboration system.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat, index) => (
            <motion.div
              key={index}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
              className="bg-card-surface border border-border-slate p-7 rounded-card shadow-subtle hover:border-primary/50 hover:shadow-card transition-all duration-200 flex flex-col justify-between group"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-primary-tint flex items-center justify-center border border-primary/20 group-hover:scale-105 transition-transform">
                    {feat.icon}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#F8F5EF] text-text-secondary border border-border-slate">
                    {feat.tag}
                  </span>
                </div>
                <h3 className="font-extrabold text-charcoal text-lg tracking-tight group-hover:text-primary transition-colors">
                  {feat.title}
                </h3>
                <p className="text-text-muted text-sm leading-relaxed">
                  {feat.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ─── SECTION 3: HOW IT WORKS ROADMAP ───────────────────────────────── */}
      <div className="max-w-7xl mx-auto py-20 px-4 sm:px-6 lg:px-8 border-b border-border-slate/60">
        <div className="text-center max-w-xl mx-auto space-y-3 mb-14">
          <span className="text-xs font-bold uppercase tracking-widest text-primary bg-primary-tint px-3 py-1 rounded-full border border-primary/20">
            Workflow Roadmap
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-charcoal tracking-tight">
            How TeamForge Works
          </h2>
          <p className="text-text-muted text-base leading-relaxed">
            From project idea to production code in four simple stages.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className="bg-white border border-border-slate p-6 rounded-card shadow-subtle space-y-3 relative overflow-hidden"
            >
              <div className="text-3xl font-black text-primary/30">
                {step.number}
              </div>
              <h4 className="font-extrabold text-charcoal text-base">
                {step.title}
              </h4>
              <p className="text-text-muted text-xs leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ─── SECTION 4: USE CASES ──────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto py-20 px-4 sm:px-6 lg:px-8 border-b border-border-slate/60">
        <div className="text-center max-w-xl mx-auto space-y-3 mb-14">
          <span className="text-xs font-bold uppercase tracking-widest text-primary bg-primary-tint px-3 py-1 rounded-full border border-primary/20">
            Target Scenarios
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-charcoal tracking-tight">
            Built for Every Student Initiative
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card-surface border border-border-slate p-7 rounded-card shadow-subtle space-y-4 hover:border-primary/40 transition-colors">
            <span className="text-4xl block">🏆</span>
            <h3 className="font-extrabold text-charcoal text-xl">Hackathon Sprints</h3>
            <p className="text-text-muted text-sm leading-relaxed">
              Find partners with complementary skills 24 hours before a hackathon starts. Plan sprint cards, assign roles, and submit winning projects together.
            </p>
          </div>

          <div className="bg-card-surface border border-border-slate p-7 rounded-card shadow-subtle space-y-4 hover:border-primary/40 transition-colors">
            <span className="text-4xl block">🎓</span>
            <h3 className="font-extrabold text-charcoal text-xl">Capstone & College Projects</h3>
            <p className="text-text-muted text-sm leading-relaxed">
              Keep every team member accountable for grading deliverables. Track commits, deadlines, and task completions in an auditable project workspace.
            </p>
          </div>

          <div className="bg-card-surface border border-border-slate p-7 rounded-card shadow-subtle space-y-4 hover:border-primary/40 transition-colors">
            <span className="text-4xl block">🚀</span>
            <h3 className="font-extrabold text-charcoal text-xl">Student Startup Ventures</h3>
            <p className="text-text-muted text-sm leading-relaxed">
              Pitch your early-stage venture idea to ambitious student developers and designers. Build an MVP and compile engineering history for accelerators.
            </p>
          </div>
        </div>
      </div>

      {/* ─── SECTION 5: CALL TO ACTION ─────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="bg-white border border-border-slate rounded-card p-10 md:p-14 text-center space-y-6 shadow-premium relative overflow-hidden">
          {/* Subtle Orange Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-tint/50 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary-tint/30 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-4">
            <h2 className="text-3xl md:text-5xl font-black text-charcoal tracking-tight">
              Ready to Build Your Next Project?
            </h2>
            <p className="text-text-muted text-base md:text-lg max-w-xl mx-auto leading-relaxed">
              Join hundreds of student developers, designers, and founders collaborating right now on TeamForge.
            </p>
            <div className="flex flex-wrap justify-center gap-4 pt-4">
              <Link
                to="/register"
                className="h-12 px-8 bg-primary hover:bg-primary-hover text-white rounded-btn text-sm font-bold flex items-center justify-center shadow-orange transition-all duration-200 hover:-translate-y-0.5"
              >
                Create Account Free
              </Link>
              <Link
                to="/projects"
                className="h-12 px-8 bg-[#F8F5EF] hover:bg-hover-surface border border-border-slate text-charcoal rounded-btn text-sm font-bold flex items-center justify-center transition-all duration-200"
              >
                Browse Active Projects
              </Link>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Home;
