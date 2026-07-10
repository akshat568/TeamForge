import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const Home = () => {
  const features = [
    {
      icon: "📋",
      title: "Workspace Boards",
      description: "Collaborate instantly with teammates and project leads using real-time task boards and progress tracks."
    },
    {
      icon: "🔍",
      title: "Project Discovery",
      description: "Find campus hackathons, startups, assignments, and open-source project listings matched to your skillset."
    },
    {
      icon: "💬",
      title: "Real-time Chat",
      description: "Message teammates or project leads in dedicated project rooms and direct chats with active presence tags."
    },
    {
      icon: "🤖",
      title: "AI Assistant",
      description: "Create task card drafts, build subtask structures, and get coding advice powered by Gemini AI models."
    },
    {
      icon: "💻",
      title: "GitHub Integration",
      description: "Track repository branches and commit histories directly within your active workspace sprint panel."
    },
    {
      icon: "📂",
      title: "Document Storage",
      description: "Upload deliverable files, slide decks, and code specifications securely in organized Cloudinary directories."
    }
  ];

  return (
    <div className="bg-bg-base text-white pt-24 pb-12 overflow-hidden min-h-screen">
      
      {/* COMPACT ANNOUNCEMENT BAR */}
      <div className="flex justify-start max-w-7xl mx-auto mt-6 mb-2 px-6">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded border border-border-slate bg-bg-secondary text-[14px] font-medium uppercase tracking-[0.12em] text-primary-light">
          <span>🚀 Beta</span>
          <span className="w-1 h-1 bg-border-slate rounded-full" />
          <span className="text-gray-400 font-medium">Join 500+ student builders collaborating now</span>
        </div>
      </div>

      {/* SECTION 1 — HERO SECTION */}
      <div className="max-w-7xl mx-auto py-12 md:py-16 px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center border-b border-border-slate/30">
        
        {/* HERO LEFT SIDE */}
        <div className="lg:col-span-6 space-y-6">
          <h1 className="text-3xl md:text-5xl lg:text-[64px] font-black tracking-tight leading-tight text-white">
            Build Projects.<br />
            Find Teammates.<br />
            <span className="text-primary-light">Ship Faster.</span>
          </h1>
          <p className="text-white/75 text-[18px] font-medium leading-[1.65] max-w-[580px]">
            TeamForge brings student builders, developers, and designers together in one place. Discover project partners, manage tasks, coordinate branches, and compile your engineering portfolio.
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            <Link
              to="/register"
              className="h-[54px] px-8 bg-primary hover:bg-primary-hover text-white rounded-btn text-[17px] font-bold flex items-center justify-center transition-colors duration-150 shadow-subtle cursor-pointer"
            >
              Get Started
            </Link>
            <Link
              to="/projects"
              className="h-[54px] px-8 border border-border-slate bg-bg-secondary hover:bg-hover-surface text-gray-300 hover:text-white rounded-btn text-[17px] font-bold flex items-center justify-center transition-colors duration-150 cursor-pointer"
            >
              Explore Projects
            </Link>
          </div>

          {/* TECH STACK BADGES */}
          <div className="pt-6 border-t border-border-slate/20 space-y-2">
            <span className="text-[14px] font-medium uppercase tracking-[0.12em] text-gray-500 block">Built with</span>
            <p className="text-[18px] text-white/75 font-medium leading-[1.65]">
              React • Node.js • Express • MongoDB • Socket.io • Gemini • Cloudinary
            </p>
          </div>
        </div>

        {/* HERO RIGHT SIDE (CLEAN MINIMAL GRAPHIC) */}
        <div className="lg:col-span-6 flex justify-center lg:justify-end">
          <div className="w-full max-w-md bg-bg-secondary border border-border-slate rounded-card p-6 shadow-premium relative space-y-6">
            
            <div className="flex items-center justify-between border-b border-border-slate/60 pb-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-primary-light animate-pulse" />
                <span className="text-[14px] uppercase tracking-[0.12em] font-medium text-gray-400">Team Network Graph</span>
              </div>
            </div>

            <div className="relative h-48 flex items-center justify-center bg-bg-base/40 rounded-card border border-border-slate/40 overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center opacity-70">
                <svg className="w-full h-full text-border-slate/60" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <line x1="50%" y1="50%" x2="20%" y2="20%" className="animate-pulse" />
                  <line x1="50%" y1="50%" x2="80%" y2="20%" className="animate-pulse" />
                  <line x1="50%" y1="50%" x2="25%" y2="75%" className="animate-pulse" />
                  <line x1="50%" y1="50%" x2="75%" y2="75%" className="animate-pulse" />
                </svg>
              </div>

              <motion.div
                animate={{ scale: [1, 1.04, 1] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                className="relative z-10 w-16 h-16 rounded-full bg-primary/20 border border-primary flex items-center justify-center font-bold text-xs text-white shadow-[0_0_20px_rgba(37,99,235,0.2)]"
              >
                Project
              </motion.div>

              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                className="absolute top-6 left-10 z-10 px-3.5 py-2 bg-card-surface border border-border-slate rounded text-[14px] uppercase tracking-[0.12em] text-primary-light font-medium shadow-subtle"
              >
                👥 Frontend
              </motion.div>
              
              <motion.div
                animate={{ y: [0, 6, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                className="absolute top-6 right-10 z-10 px-3.5 py-2 bg-card-surface border border-border-slate rounded text-[14px] uppercase tracking-[0.12em] text-success font-medium shadow-subtle"
              >
                💻 Backend
              </motion.div>

              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
                className="absolute bottom-6 left-14 z-10 px-3.5 py-2 bg-card-surface border border-border-slate rounded text-[14px] uppercase tracking-[0.12em] text-warning font-medium shadow-subtle"
              >
                🎨 Designer
              </motion.div>

              <motion.div
                animate={{ y: [0, 5, 0] }}
                transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut" }}
                className="absolute bottom-6 right-14 z-10 px-3.5 py-2 bg-card-surface border border-border-slate rounded text-[14px] uppercase tracking-[0.12em] text-info font-medium shadow-subtle"
              >
                🔧 QA Test
              </motion.div>
            </div>

            <div className="p-3.5 bg-bg-base border border-border-slate/60 rounded-card font-mono text-[14px] text-gray-400 space-y-1 shadow-subtle">
              <p className="text-gray-500">$ git merge feature/sprint-board</p>
              <p className="text-success">✔ Merging commits success • 4 conflicts resolved</p>
              <p className="text-primary-light">Updating active workspace models...</p>
            </div>

          </div>
        </div>

      </div>

      {/* SECTION 2 — FEATURES CARD GRID */}
      <div className="max-w-7xl mx-auto pt-20 pb-20 px-6 border-b border-border-slate/30 mb-20">
        <div className="text-center max-w-xl mx-auto space-y-3">
          <span className="text-[14px] font-medium uppercase tracking-[0.12em] text-primary-light block">Workspace Capabilities</span>
          <h2 className="text-[32px] md:text-[40px] lg:text-[46px] font-bold text-white tracking-tight leading-tight">Handcrafted Features</h2>
          <p className="text-white/75 text-[18px] font-medium leading-[1.65]">
            Everything your team needs to plan sprint targets, store specs, connect codebases, and compile portfolios.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
          {features.map((feat, index) => (
            <motion.div
              key={index}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
              className="bg-bg-secondary border border-border-slate p-8 rounded-card shadow-subtle flex flex-col justify-between hover:border-primary/45 hover:shadow-[0_0_25px_rgba(37,99,235,0.12)] transition-all duration-200 min-h-[160px] group"
            >
              <div className="space-y-3">
                <span className="text-[42px] transition-transform duration-200 group-hover:scale-110 block w-fit">{feat.icon}</span>
                <h3 className="font-bold text-white text-[26px] leading-snug">{feat.title}</h3>
                <p className="text-white/75 text-[18px] font-medium leading-[1.65]">
                  {feat.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* SECTION 3 — WORKFLOW TIMELINE */}
      <div className="max-w-7xl mx-auto pt-20 pb-20 px-6 border-b border-border-slate/30 grid grid-cols-1 lg:grid-cols-12 gap-12 mb-20">
        <div className="lg:col-span-4 space-y-4 self-center">
          <span className="text-[14px] font-medium uppercase tracking-[0.12em] text-primary-light block">Workflow Timeline</span>
          <h2 className="text-[32px] md:text-[40px] lg:text-[46px] font-bold text-white tracking-tight leading-tight">How TeamForge works</h2>
          <p className="text-white/75 text-[18px] font-medium leading-[1.65]">
            Transition smoothly from campus idea listings to shipping code. Organize assignments, track backlogs, and showcase achievements.
          </p>
        </div>
        
        <div className="lg:col-span-8 space-y-6">
          <div className="relative border-l border-border-slate pl-6 ml-3 space-y-6">
            <div className="relative">
              <span className="absolute -left-[31px] top-2.5 w-3 h-3 rounded-full bg-primary" />
              <h3 className="font-bold text-white text-[26px] leading-tight">Create Project</h3>
              <p className="text-white/75 text-[18px] font-medium leading-[1.65] mt-1">Configure workspace parameters, roles, skills, and invite classmates to apply.</p>
            </div>
            <div className="relative">
              <span className="absolute -left-[31px] top-2.5 w-3 h-3 rounded-full bg-primary" />
              <h3 className="font-bold text-white text-[26px] leading-tight">Invite Members</h3>
              <p className="text-white/75 text-[18px] font-medium leading-[1.65] mt-1">Review incoming student requests. Check profiles, portfolios, and confirm acceptances.</p>
            </div>
            <div className="relative">
              <span className="absolute -left-[31px] top-2.5 w-3 h-3 rounded-full bg-primary" />
              <h3 className="font-bold text-white text-[26px] leading-tight">Collaborate</h3>
              <p className="text-white/75 text-[18px] font-medium leading-[1.65] mt-1">Trace tasks on Kanban boards, upload deliverables, log activity logs, and chat.</p>
            </div>
            <div className="relative">
              <span className="absolute -left-[31px] top-2.5 w-3 h-3 rounded-full bg-primary" />
              <h3 className="font-bold text-white text-[26px] leading-tight">Deliver</h3>
              <p className="text-white/75 text-[18px] font-medium leading-[1.65] mt-1">Close sprint targets, compile deliverables history, and publish portfolio links.</p>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 4 — USE CASES */}
      <div className="max-w-7xl mx-auto pt-20 pb-20 px-6 border-b border-border-slate/30 space-y-12 mb-20">
        <div className="text-center max-w-xl mx-auto space-y-3">
          <span className="text-[14px] font-medium uppercase tracking-[0.12em] text-primary-light block">Use Cases</span>
          <h2 className="text-[32px] md:text-[40px] lg:text-[46px] font-bold text-white tracking-tight leading-tight">Structured for Student Environments</h2>
          <p className="text-white/75 text-[18px] font-medium leading-[1.65]">
            TeamForge coordinates developer workflows inside classrooms, coding sprints, and study groups.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
          <div className="bg-bg-secondary border border-border-slate p-6 rounded-card shadow-subtle hover:border-primary/45 hover:shadow-premium transition-all duration-200 min-h-[180px] flex flex-col justify-between group">
            <div className="space-y-3">
              <span className="text-[42px] transition-transform duration-200 group-hover:scale-110 block w-fit">🏆</span>
              <h4 className="font-bold text-white text-[26px] leading-snug">Hackathon Teams</h4>
              <p className="text-white/75 text-[18px] font-medium leading-[1.65]">
                Assemble builders instantly. List open positions, coordinate tasks, link GitHub, and deliver prototypes.
              </p>
            </div>
          </div>

          <div className="bg-bg-secondary border border-border-slate p-6 rounded-card shadow-subtle hover:border-primary/45 hover:shadow-premium transition-all duration-200 min-h-[180px] flex flex-col justify-between group">
            <div className="space-y-3">
              <span className="text-[42px] transition-transform duration-200 group-hover:scale-110 block w-fit">🎓</span>
              <h4 className="font-bold text-white text-[26px] leading-snug">College Projects</h4>
              <p className="text-white/75 text-[18px] font-medium leading-[1.65]">
                Organize group assignments. Plan tasks, track milestones, store references, and manage activity logs.
              </p>
            </div>
          </div>

          <div className="bg-bg-secondary border border-border-slate p-6 rounded-card shadow-subtle hover:border-primary/45 hover:shadow-premium transition-all duration-200 min-h-[180px] flex flex-col justify-between group">
            <div className="space-y-3">
              <span className="text-[42px] transition-transform duration-200 group-hover:scale-110 block w-fit">💻</span>
              <h4 className="font-bold text-white text-[26px] leading-snug">Open Source Collaboration</h4>
              <p className="text-white/75 text-[18px] font-medium leading-[1.65]">
                Publish repository backlogs. Trace branch streams, check commit histories, and synchronize changes.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 5 — CALL TO ACTION */}
      <div className="max-w-5xl mx-auto py-12 md:py-16 px-6 text-center space-y-6">
        <h2 className="text-[32px] md:text-[40px] lg:text-[50px] font-bold text-white tracking-tight leading-tight">
          Ready to Build Your Next Project?
        </h2>
        <p className="text-white/75 text-[20px] font-medium max-w-2xl mx-auto leading-relaxed">
          Create projects, collaborate with teammates, and showcase your work—all in one place.
        </p>
        <div className="flex justify-center gap-4 pt-2">
          <Link
            to="/register"
            className="h-[58px] px-10 bg-primary hover:bg-primary-hover text-white rounded-btn text-[18px] font-bold flex items-center justify-center transition-colors duration-150 shadow-subtle cursor-pointer"
          >
            Create Account
          </Link>
          <Link
            to="/projects"
            className="h-[58px] px-10 border border-border-slate bg-bg-secondary hover:bg-hover-surface text-gray-300 hover:text-white rounded-btn text-[18px] font-bold flex items-center justify-center transition-colors duration-150 cursor-pointer"
          >
            Browse Projects
          </Link>
        </div>
      </div>

    </div>
  );
};

export default Home;
