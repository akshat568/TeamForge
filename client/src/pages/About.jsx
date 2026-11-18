import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const About = () => {
  const features = [
    { icon: "🔍", title: "Project Discovery", desc: "Discover active campus hackathons, open source initiatives, startups, and college assignments matching your skills." },
    { icon: "🤝", title: "Workspace Collaboration", desc: "Bring developers, designers, and leads together in dedicated rooms with real-time socket connections." },
    { icon: "📋", title: "Kanban Board", desc: "Plan sprint items, assign tasks, set weights, and drag columns to update progress states in real time." },
    { icon: "💬", title: "Real-time Chat", desc: "Communicate with project leads or accepted applicants in dedicated project rooms or direct channels." },
    { icon: "🤖", title: "AI Assistant", desc: "Auto-draft task specifications, summarize project timelines, and query backlogs powered by Gemini AI." },
    { icon: "💻", title: "GitHub Integration", desc: "Link repositories, select branches, and review chronological commit streams directly inside your workspace." },
    { icon: "📂", title: "Cloud Document Storage", desc: "Upload project specs, Figma links, and assets securely to organized Cloudinary directories." },
    { icon: "🔔", title: "Notifications", desc: "Receive navbar bell triggers for task reassignments, new members, and file updates in real time." }
  ];

  const techStack = {
    Frontend: ["React 19", "Vite", "Tailwind CSS v4", "Framer Motion"],
    Backend: ["Node.js", "Express.js"],
    Database: ["MongoDB", "Mongoose"],
    Authentication: ["JWT", "bcrypt"],
    "Real-Time": ["Socket.IO"],
    "Cloud Storage": ["Cloudinary"],
    AI: ["Google Gemini API"],
    "Version Control": ["GitHub REST API"]
  };

  const architecture = [
    { title: "React Frontend", desc: "Single Page App compiled via Vite, using Tailwind v4 styling and Framer Motion for smooth micro-interactions." },
    { title: "Express REST API", desc: "Provides secure HTTP controllers, request validation, and page routing operations." },
    { title: "JWT Authentication", desc: "Guards and authorizes API endpoints using JSON Web Token middleware and encrypted credentials." },
    { title: "MongoDB", desc: "Handles relational document storage, user profiles, workspaces, and query indexing." },
    { title: "Socket.IO", desc: "Broadcasts live task changes, user presence indicators, and timeline activities to connected client rooms." },
    { title: "Cloudinary", desc: "Serves as secure, remote file storage for deliverables, project specifications, and attachments." },
    { title: "Gemini AI", desc: "Generates task descriptions, automated sprint plans, and contextual workspace blueprints." }
  ];

  const journeySteps = [
    "Planning & System Architecture",
    "Authentication & Security Models",
    "Project Discovery & Role Matching",
    "Workspace & Kanban Collaboration",
    "Real-Time Socket.IO Synchronization",
    "Gemini AI Assistant Integration",
    "Performance Optimization & Production"
  ];

  const roadmap = [
    { title: "Calendar & Deadlines", desc: "Coordinate visual team milestones and assignment deadlines across all enrolled workspaces." },
    { title: "Team Analytics", desc: "Review task completion ratios, contributor activity velocity, and burndown progress." },
    { title: "AI Team Recommendations", desc: "Suggest optimal candidates based on project skill requirements and past completion records." },
    { title: "Public Project Portfolio", desc: "Generate public showcases for completed projects to share with recruiters and hackathon judges." },
    { title: "Sprint Reports", desc: "Compile summary reports of task weight execution and velocity over time." }
  ];

  return (
    <div className="bg-bg-base text-text-primary pt-32 pb-20 px-4 sm:px-6 lg:px-8 min-h-screen">
      
      {/* ─── HERO SECTION ─────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto py-12 text-center space-y-6 border-b border-border-slate/60 pb-16">
        <span className="text-xs font-bold uppercase tracking-widest text-primary bg-primary-tint px-3.5 py-1.5 rounded-full border border-primary/20">
          Platform Overview
        </span>
        <h1 className="text-4xl md:text-6xl font-black tracking-tight text-charcoal max-w-3xl mx-auto leading-tight">
          About Team<span className="text-primary">Forge</span>
        </h1>
        <p className="text-text-muted text-base md:text-lg leading-relaxed max-w-2xl mx-auto">
          TeamForge is the dedicated collaboration and project workspace platform built specifically for student developers, hackathon teams, and campus creators to assemble teams, run sprints, and ship remarkable products.
        </p>
        <div className="flex justify-center gap-4 pt-2">
          <Link
            to="/projects"
            className="h-12 px-7 bg-primary hover:bg-primary-hover text-white rounded-btn text-sm font-bold flex items-center justify-center shadow-orange transition-all duration-200 hover:-translate-y-0.5"
          >
            Explore Projects
          </Link>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="h-12 px-7 bg-white hover:bg-hover-surface border border-border-slate text-charcoal rounded-btn text-sm font-bold flex items-center justify-center shadow-subtle transition-all duration-200"
          >
            GitHub Repository
          </a>
        </div>
      </div>

      {/* ─── WHY TEAMFORGE SECTION ────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto py-16 border-b border-border-slate/60 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-4 space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-primary">The Vision</span>
          <h2 className="text-3xl font-extrabold text-charcoal tracking-tight">Why TeamForge?</h2>
        </div>
        <div className="lg:col-span-8 space-y-4 text-text-secondary text-base leading-relaxed">
          <p>
            Students frequently coordinate ambitious engineering projects across fragmented, disconnected platforms. Important discussions get lost in chaotic WhatsApp chats, deliverables vanish into messy Google Drive folders, tasks get scattered across generic boards, and branch history remains disconnected from team goals.
          </p>
          <p>
            <strong className="text-charcoal font-bold">TeamForge solves this by centralizing the complete student project lifecycle</strong>: from pitching an idea and recruiting matching classmates, to running real-time Kanban sprints, integrating GitHub repositories, securing files with Cloudinary, and leveraging Gemini AI models to structure backlogs.
          </p>
        </div>
      </div>

      {/* ─── FEATURES GRID ────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto py-16 border-b border-border-slate/60 space-y-10">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-primary">Core Modules</span>
          <h2 className="text-3xl font-extrabold text-charcoal tracking-tight">Everything Teams Need to Ship</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((feat, index) => (
            <div
              key={index}
              className="bg-white border border-border-slate p-6 rounded-card shadow-subtle hover:border-primary/40 transition-colors flex flex-col justify-between"
            >
              <div className="space-y-3">
                <span className="text-3xl block">{feat.icon}</span>
                <h3 className="font-extrabold text-charcoal text-base">{feat.title}</h3>
                <p className="text-text-muted text-xs leading-relaxed">{feat.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── TECH STACK SECTION ───────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto py-16 border-b border-border-slate/60 space-y-10">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-primary">Engineering Stack</span>
          <h2 className="text-3xl font-extrabold text-charcoal tracking-tight">Production-Grade Technologies</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {Object.entries(techStack).map(([category, items]) => (
            <div key={category} className="bg-white border border-border-slate p-6 rounded-card shadow-subtle space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-primary">{category}</h4>
              <div className="flex flex-wrap gap-1.5">
                {items.map((tech) => (
                  <span
                    key={tech}
                    className="text-xs font-semibold px-2.5 py-1 bg-[#F8F5EF] text-charcoal rounded-md border border-border-slate"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── ARCHITECTURE BREAKDOWN ───────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto py-16 border-b border-border-slate/60 space-y-10">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-primary">System Design</span>
          <h2 className="text-3xl font-extrabold text-charcoal tracking-tight">Full-Stack MERN Architecture</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {architecture.map((item, idx) => (
            <div key={idx} className="bg-white border border-border-slate p-5 rounded-card shadow-subtle flex gap-4 items-start">
              <div className="w-8 h-8 rounded-lg bg-primary-tint text-primary font-bold text-xs flex items-center justify-center shrink-0 border border-primary/20">
                0{idx + 1}
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-charcoal">{item.title}</h4>
                <p className="text-xs text-text-muted leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── DEVELOPMENT JOURNEY ──────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto py-16 border-b border-border-slate/60 space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-primary">Methodology</span>
          <h2 className="text-3xl font-extrabold text-charcoal tracking-tight">Development Milestones</h2>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          {journeySteps.map((step, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="px-3.5 py-1.5 rounded-full bg-white border border-border-slate text-xs font-bold text-charcoal shadow-subtle flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary" />
                <span>{step}</span>
              </span>
              {idx < journeySteps.length - 1 && (
                <span className="text-text-muted text-xs hidden sm:inline">➔</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ─── ROADMAP ──────────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto py-16 space-y-10">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-primary">Future Horizons</span>
          <h2 className="text-3xl font-extrabold text-charcoal tracking-tight">Platform Roadmap</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {roadmap.map((item, idx) => (
            <div key={idx} className="bg-white border border-border-slate p-6 rounded-card shadow-subtle space-y-2 hover:border-primary/40 transition-colors">
              <div className="flex items-center gap-2 text-primary font-bold text-xs">
                <span>✦</span>
                <span>Upcoming Feature</span>
              </div>
              <h4 className="text-base font-bold text-charcoal">{item.title}</h4>
              <p className="text-xs text-text-muted leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default About;
