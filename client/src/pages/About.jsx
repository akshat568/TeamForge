import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const About = () => {
  const features = [
    { icon: "🔍", title: "Project Discovery", desc: "Discover active campus hackathons, open source initiatives, startups, and college assignments matching your skills." },
    { icon: "🤝", title: "Workspace Collaboration", desc: "Bring developers, designers, and leads together in dedicated rooms with real-time socket connections." },
    { icon: "📋", title: "Kanban Board", desc: "Plan sprint items, assign tasks, set weights, and drag columns to update progress states." },
    { icon: "💬", title: "Real-time Chat", desc: "Communicate with project leads or accepted applicants in dedicated project rooms or direct channels." },
    { icon: "🤖", title: "AI Assistant", desc: "Auto-draft task specifications, summarize project timelines, and query backlogs powered by Gemini AI." },
    { icon: "💻", title: "GitHub Integration", desc: "Link repositories, select branches, and review chronological commit streams directly inside your workspace." },
    { icon: "📂", title: "Cloud Document Storage", desc: "Upload project specs, Figma links, and assets securely to organized Cloudinary directories." },
    { icon: "🔔", title: "Notifications", desc: "Receive navbar bell triggers for task reassignments, new members, and file updates in real time." }
  ];

  const techStack = {
    Frontend: ["React", "Vite", "Tailwind CSS"],
    Backend: ["Node.js", "Express.js"],
    Database: ["MongoDB"],
    Authentication: ["JWT", "bcrypt"],
    "Real-Time": ["Socket.IO"],
    "Cloud Storage": ["Cloudinary"],
    AI: ["Google Gemini API"],
    "Version Control": ["GitHub API"]
  };

  const architecture = [
    { title: "React Frontend", desc: "Single Page App compiled via Vite, using Tailwind v4 styling and Framer Motion." },
    { title: "Express REST API", desc: "Provides secure HTTP controllers and page routing operations." },
    { title: "JWT Authentication", desc: "Guards and authorizes API endpoints using JSON Web Token middleware." },
    { title: "MongoDB", desc: "Handles relational document storage and query indexing." },
    { title: "Socket.IO", desc: "Broadcasts live task changes and timeline activities to connected client rooms." },
    { title: "Cloudinary", desc: "Serves as secure, remote file storage for deliverables and attachments." },
    { title: "Gemini AI", desc: "Generates task descriptions and contextual workspace blueprints." }
  ];

  const journeySteps = [
    "Planning",
    "Authentication",
    "Project Discovery",
    "Workspace Collaboration",
    "Real-Time Features",
    "AI Integration",
    "Deployment"
  ];

  const roadmap = [
    { title: "Calendar & Deadlines", desc: "Coordinate visual team milestones and assignment deadlines." },
    { title: "Team Analytics", desc: "Review task completion ratios and contributor activity charts." },
    { title: "AI Team Recommendations", desc: "Suggest optimal candidates based on project skill needs." },
    { title: "Public Project Portfolio", desc: "Generate public showcases for completed projects." },
    { title: "Sprint Reports", desc: "Compile summary reports of task weight execution over time." }
  ];

  return (
    <div className="bg-bg-base text-white pt-32 pb-20 px-6 min-h-screen">
      
      {/* HERO SECTION */}
      <div className="max-w-7xl mx-auto py-16 text-center space-y-6 border-b border-border-slate/30">
        <span className="text-[14px] font-semibold uppercase tracking-widest text-primary-light block">Platform Overview</span>
        <h1 className="text-4xl md:text-[58px] font-extrabold leading-none tracking-tight text-white max-w-4xl mx-auto">
          About TeamForge
        </h1>
        <p className="text-white/75 text-[18px] font-medium leading-[1.65] max-w-2xl mx-auto">
          TeamForge is a collaborative project management platform built specifically for students, enabling teams to discover projects, collaborate in real time, manage tasks efficiently, and showcase their work.
        </p>
        <div className="flex justify-center gap-4 pt-2">
          <Link
            to="/projects"
            className="h-[54px] px-8 bg-primary hover:bg-primary-hover text-white rounded-btn text-[17px] font-bold flex items-center justify-center transition-colors duration-150 shadow-subtle cursor-pointer"
          >
            View Projects
          </Link>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="h-[54px] px-8 border border-border-slate bg-bg-secondary hover:bg-hover-surface text-gray-300 hover:text-white rounded-btn text-[17px] font-bold flex items-center justify-center transition-colors duration-150"
          >
            GitHub Repository
          </a>
        </div>
      </div>

      {/* WHY TEAMFORGE SECTION */}
      <div className="max-w-7xl mx-auto py-20 border-b border-border-slate/30 grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-4 self-center space-y-3">
          <span className="text-[14px] font-semibold uppercase tracking-widest text-primary-light block">The Problem</span>
          <h2 className="text-[32px] md:text-[40px] lg:text-[46px] font-bold text-white tracking-tight leading-tight">Why TeamForge?</h2>
        </div>
        <div className="lg:col-span-8 space-y-4 text-white/75 text-[18px] font-medium leading-[1.65]">
          <p>
            Students usually manage engineering projects across multiple disconnected platforms. Coordination often becomes scattered across WhatsApp chats, Google Drive folders, Trello boards, email chains, and GitHub branches.
          </p>
          <p>
            TeamForge unifies these workflows. We bring project discovery, team recruiting, sprint coordination, secure asset storage, real-time messaging, and context-aware AI planning into a single platform built specifically for student builders.
          </p>
        </div>
      </div>

      {/* CORE FEATURES SECTION */}
      <div className="max-w-7xl mx-auto py-20 border-b border-border-slate/30 space-y-12">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <span className="text-[14px] font-bold uppercase tracking-widest text-primary-light block">Features</span>
          <h2 className="text-[32px] md:text-[40px] lg:text-[46px] font-bold text-white tracking-tight leading-tight">Platform Core</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feat, index) => (
            <div
              key={index}
              className="bg-bg-secondary border border-border-slate p-6 rounded-card shadow-subtle hover:border-primary/45 hover:shadow-[0_0_25px_rgba(37,99,235,0.1)] transition-all duration-200"
            >
              <span className="text-3xl block mb-3">{feat.icon}</span>
              <h3 className="font-bold text-white text-[20px] mb-2">{feat.title}</h3>
              <p className="text-white/75 text-[15px] leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* TECHNOLOGY STACK SECTION */}
      <div className="max-w-7xl mx-auto py-20 border-b border-border-slate/30 space-y-12">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <span className="text-[14px] font-bold uppercase tracking-widest text-primary-light block">Built With</span>
          <h2 className="text-[32px] md:text-[40px] lg:text-[46px] font-bold text-white tracking-tight leading-tight">Technology Stack</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.entries(techStack).map(([category, items]) => (
            <div key={category} className="bg-bg-secondary border border-border-slate p-6 rounded-card">
              <h3 className="text-gray-400 text-[14px] uppercase tracking-widest font-semibold mb-4">{category}</h3>
              <div className="flex flex-wrap gap-2">
                {items.map((item) => (
                  <span
                    key={item}
                    className="px-3 py-1.5 bg-bg-base border border-border-slate text-[14px] font-medium rounded text-gray-300"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ARCHITECTURE SECTION */}
      <div className="max-w-7xl mx-auto py-20 border-b border-border-slate/30 space-y-12">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <span className="text-[14px] font-bold uppercase tracking-widest text-primary-light block">Flow Diagram</span>
          <h2 className="text-[32px] md:text-[40px] lg:text-[46px] font-bold text-white tracking-tight leading-tight">Architecture</h2>
        </div>
        
        {/* Simple architecture cards timeline */}
        <div className="max-w-3xl mx-auto space-y-4">
          {architecture.map((arch, index) => (
            <div key={index} className="flex gap-4 items-start">
              <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary flex items-center justify-center shrink-0 text-xs font-bold text-primary-light mt-1">
                {index + 1}
              </div>
              <div className="bg-bg-secondary border border-border-slate p-5 rounded-card flex-1">
                <h4 className="font-bold text-white text-[18px] mb-1">{arch.title}</h4>
                <p className="text-white/75 text-[15px] leading-relaxed">{arch.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* DEVELOPMENT JOURNEY SECTION */}
      <div className="max-w-7xl mx-auto py-20 border-b border-border-slate/30 space-y-12">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <span className="text-[14px] font-bold uppercase tracking-widest text-primary-light block">Timeline</span>
          <h2 className="text-[32px] md:text-[40px] lg:text-[46px] font-bold text-white tracking-tight leading-tight">Development Journey</h2>
        </div>

        <div className="max-w-3xl mx-auto relative border-l border-border-slate pl-6 ml-3 space-y-8">
          {journeySteps.map((step, index) => (
            <div key={index} className="relative">
              <span className="absolute -left-[31px] top-2 w-3 h-3 rounded-full bg-primary" />
              <h3 className="font-bold text-white text-[20px]">{step}</h3>
              <p className="text-gray-400 text-[14px] mt-0.5">Sprint Stage {index + 1} completed</p>
            </div>
          ))}
        </div>
      </div>

      {/* FUTURE ROADMAP SECTION */}
      <div className="max-w-7xl mx-auto py-20 space-y-12">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <span className="text-[14px] font-bold uppercase tracking-widest text-primary-light block">Roadmap</span>
          <h2 className="text-[32px] md:text-[40px] lg:text-[46px] font-bold text-white tracking-tight leading-tight">Future Releases</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roadmap.map((item, index) => (
            <div key={index} className="bg-bg-secondary border border-border-slate p-6 rounded-card">
              <div className="text-primary-light text-xs font-bold uppercase tracking-wider mb-2">Upcoming Feature</div>
              <h4 className="font-bold text-white text-[20px] mb-2">{item.title}</h4>
              <p className="text-white/75 text-[15px] leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default About;
