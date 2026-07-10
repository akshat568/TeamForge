import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import api from "../services/api";

const Dashboard = () => {
  const { user, logout } = useAuth();

  const [deadlines, setDeadlines] = useState({
    today: [],
    tomorrow: [],
    overdue: [],
    completedThisWeek: [],
  });
  const [deadlinesLoading, setDeadlinesLoading] = useState(true);

  useEffect(() => {
    const fetchDeadlines = async () => {
      try {
        setDeadlinesLoading(true);
        const wsRes = await api.get("/projects/user-workspaces");
        if (wsRes.data.success) {
          const wsList = wsRes.data.workspaces;
          const todayTasks = [];
          const tomorrowTasks = [];
          const overdueTasks = [];
          const completedTasks = [];

          const now = new Date();
          const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
          
          const startOfTomorrow = new Date(startOfToday);
          startOfTomorrow.setDate(startOfToday.getDate() + 1);
          const endOfTomorrow = new Date(endOfToday);
          endOfTomorrow.setDate(endOfToday.getDate() + 1);

          const startOfWeek = new Date(startOfToday);
          startOfWeek.setDate(startOfToday.getDate() - 7);

          await Promise.all(
            wsList.map(async (ws) => {
              try {
                const tasksRes = await api.get(`/tasks/project/${ws._id}`);
                if (tasksRes.data.success) {
                  tasksRes.data.tasks.forEach((task) => {
                    if (!task.dueDate) return;
                    const due = new Date(task.dueDate);
                    const isCompleted = task.status === "Completed";

                    if (isCompleted) {
                      if (due >= startOfWeek && due <= endOfToday) {
                        completedTasks.push({ ...task, workspaceId: ws._id, workspaceTitle: ws.title });
                      }
                    } else if (due < startOfToday) {
                      overdueTasks.push({ ...task, workspaceId: ws._id, workspaceTitle: ws.title });
                    } else if (due >= startOfToday && due <= endOfToday) {
                      todayTasks.push({ ...task, workspaceId: ws._id, workspaceTitle: ws.title });
                    } else if (due >= startOfTomorrow && due <= endOfTomorrow) {
                      tomorrowTasks.push({ ...task, workspaceId: ws._id, workspaceTitle: ws.title });
                    }
                  });
                }
              } catch (err) {
                console.error("Error fetching tasks for workspace", ws.title, err);
              }
            })
          );

          setDeadlines({
            today: todayTasks,
            tomorrow: tomorrowTasks,
            overdue: overdueTasks,
            completedThisWeek: completedTasks,
          });
        }
      } catch (err) {
        console.error("Error loading deadlines for dashboard widget:", err);
      } finally {
        setDeadlinesLoading(false);
      }
    };

    fetchDeadlines();
  }, []);

  const quickActions = [
    {
      title: "Create Project",
      description: "Post a new project, hackathon team requirement, or startup idea to invite other students.",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      path: "/projects/new",
      color: "from-primary/10 to-transparent",
      borderColor: "group-hover:border-primary/50",
      iconColor: "text-primary-light",
    },
    {
      title: "Browse Projects",
      description: "Explore active listings, filter by skills or category, and apply to join teams that interest you.",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
      path: "/projects",
      color: "from-info/10 to-transparent",
      borderColor: "group-hover:border-info/50",
      iconColor: "text-info",
    },
    {
      title: "My Applications",
      description: "Track your pending, approved, and rejected team applications for other student projects.",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
      path: "/applications",
      color: "from-success/10 to-transparent",
      borderColor: "group-hover:border-success/50",
      iconColor: "text-success",
    },
    {
      title: "My Profile",
      description: "Manage your portfolio, update your skills, academic information, and social links.",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      path: "/profile",
      color: "from-warning/10 to-transparent",
      borderColor: "group-hover:border-warning/50",
      iconColor: "text-warning",
    },
  ];

  return (
    <div className="min-h-screen bg-bg-base text-white pt-28 pb-16 px-6 relative overflow-hidden">
      <div className="max-w-6xl mx-auto relative z-10">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 bg-bg-secondary border border-border-slate p-8 rounded-card shadow-subtle"
        >
          <div>
            <span className="text-xs font-semibold text-primary-light uppercase tracking-widest bg-primary/10 px-3.5 py-1.5 rounded-full border border-primary/20">
              Student Dashboard
            </span>
            <h1 className="text-3xl md:text-4xl font-black mt-4 tracking-tight">
              Welcome back, <span className="gradient-text">{user?.name || "Builder"}</span>!
            </h1>
            <p className="text-gray-400 text-sm mt-2 max-w-xl">
              {user?.college ? `${user.college} | ` : ""}{user?.branch ? `${user.branch} | ` : ""}{user?.year || ""}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={logout}
              className="px-5 py-2.5 rounded-btn text-sm font-semibold text-gray-300 hover:text-white border border-border-slate hover:bg-hover-surface transition-all cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </motion.div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Quick Actions - 2 Columns */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-bold tracking-tight text-white mb-2">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {quickActions.map((action, idx) => (
                <motion.div
                  key={action.title}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: idx * 0.1 }}
                  whileHover={{ y: -4 }}
                >
                  <Link
                    to={action.path}
                    className={`group block relative h-full bg-card-surface border border-border-slate rounded-card p-6 transition-all duration-200 ${action.borderColor} overflow-hidden shadow-subtle`}
                  >
                    {/* Hover Card Glow */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 group-hover:opacity-100 transition-opacity duration-200`} />
                    
                    <div className="relative z-10 flex flex-col h-full justify-between">
                      <div>
                        <div className={`w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-4 ${action.iconColor} group-hover:scale-110 transition-transform`}>
                          {action.icon}
                        </div>
                        <h3 className="text-white font-bold text-lg mb-2 group-hover:text-primary-light transition-colors">
                          {action.title}
                        </h3>
                        <p className="text-gray-400 text-sm leading-relaxed">
                          {action.description}
                        </p>
                      </div>
                      
                      <div className="mt-6 flex items-center gap-1 text-primary-light text-xs font-semibold group-hover:text-white">
                        Get Started
                        <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>

          {/* User Profile Summary - 1 Column */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="bg-bg-secondary border border-border-slate rounded-card p-6 h-fit shadow-subtle"
          >
            <h2 className="text-xl font-bold tracking-tight text-white mb-6">
              My Profile Status
            </h2>

            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-full gradient-bg flex items-center justify-center font-bold text-lg text-white">
                {user?.name ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "TF"}
              </div>
              <div>
                <h3 className="font-bold text-white text-base leading-snug">{user?.name}</h3>
                <p className="text-xs text-primary-light font-medium">{user?.email}</p>
              </div>
            </div>

            <div className="space-y-4 text-sm text-gray-400 border-t border-border-slate pt-4">
              <div>
                <span className="text-xs font-semibold text-gray-500 block uppercase tracking-wider">College</span>
                <span className="text-white font-medium block mt-0.5">{user?.college || "Not set"}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs font-semibold text-gray-500 block uppercase tracking-wider">Branch</span>
                  <span className="text-white font-medium block mt-0.5">{user?.branch || "Not set"}</span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-gray-500 block uppercase tracking-wider">Year</span>
                  <span className="text-white font-medium block mt-0.5">{user?.year || "Not set"}</span>
                </div>
              </div>
              <div>
                <span className="text-xs font-semibold text-gray-500 block uppercase tracking-wider">Skills</span>
                {user?.skills && user.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {user.skills.map((skill) => (
                      <span key={skill} className="text-xs bg-primary/10 text-primary-light border border-primary/20 px-2 py-0.5 rounded font-medium">
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs italic text-gray-500 block mt-1">No skills added yet</span>
                )}
              </div>
            </div>

            <Link
              to="/profile"
              className="w-full text-center block mt-6 py-2.5 rounded-btn text-xs font-semibold text-white bg-primary hover:bg-primary-hover transition-colors"
            >
              Complete Profile Info
            </Link>
          </motion.div>

          {/* Upcoming Deadlines Widget */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="bg-bg-secondary border border-border-slate rounded-card p-6 h-fit shadow-subtle space-y-4"
          >
            <div className="flex justify-between items-center pb-3 border-b border-border-slate/40">
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400">
                ⏳ Upcoming Deadlines
              </h2>
              <Link to="/calendar" className="text-[10px] text-primary hover:text-primary-hover font-bold">
                View Calendar ➔
              </Link>
            </div>

            {deadlinesLoading ? (
              <div className="flex justify-center py-6">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="space-y-4 text-xs text-left">
                
                {/* Overdue */}
                {deadlines.overdue.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-danger uppercase tracking-wider block">🚨 Overdue</span>
                    <div className="space-y-1.5 pl-2 border-l border-danger/40">
                      {deadlines.overdue.map(task => (
                        <Link key={task._id} to={`/workspace/${task.workspaceId}`} className="block hover:underline truncate text-white">
                          • {task.title} <span className="text-gray-500 text-[10px]">({task.workspaceTitle})</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Today */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-warning uppercase tracking-wider block">📅 Due Today</span>
                  {deadlines.today.length > 0 ? (
                    <div className="space-y-1.5 pl-2 border-l border-warning/40">
                      {deadlines.today.map(task => (
                        <Link key={task._id} to={`/workspace/${task.workspaceId}`} className="block hover:underline truncate text-white">
                          • {task.title} <span className="text-gray-500 text-[10px]">({task.workspaceTitle})</span>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <span className="text-gray-500 text-[10px] block pl-2">No tasks due today.</span>
                  )}
                </div>

                {/* Tomorrow */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-primary-light uppercase tracking-wider block">📅 Due Tomorrow</span>
                  {deadlines.tomorrow.length > 0 ? (
                    <div className="space-y-1.5 pl-2 border-l border-primary/40">
                      {deadlines.tomorrow.map(task => (
                        <Link key={task._id} to={`/workspace/${task.workspaceId}`} className="block hover:underline truncate text-white">
                          • {task.title} <span className="text-gray-500 text-[10px]">({task.workspaceTitle})</span>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <span className="text-gray-500 text-[10px] block pl-2">No tasks due tomorrow.</span>
                  )}
                </div>

                {/* Completed this week */}
                {deadlines.completedThisWeek.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-border-slate/30">
                    <span className="text-[10px] font-bold text-success uppercase tracking-wider block">✓ Completed This Week</span>
                    <div className="space-y-1.5 pl-2 border-l border-success/40">
                      {deadlines.completedThisWeek.slice(0, 3).map(task => (
                        <span key={task._id} className="block text-gray-400 line-through truncate">
                          • {task.title} <span className="text-gray-500 text-[9px] line-through">({task.workspaceTitle})</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
