import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import api from "../services/api";
import sprintService from "../services/sprintService";

const Dashboard = () => {
  const { user, logout } = useAuth();

  const [workspaces, setWorkspaces] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [deadlines, setDeadlines] = useState({
    today: [],
    tomorrow: [],
    overdue: [],
    completedThisWeek: [],
  });
  const [loading, setLoading] = useState(true);
  const [taskFilter, setTaskFilter] = useState("all"); // "all", "today", "in_progress", "overdue", "completed"

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const wsRes = await api.get("/projects/user-workspaces");
        if (wsRes.data.success) {
          const wsList = wsRes.data.workspaces || [];
          setWorkspaces(wsList);

          const allTasks = [];
          const allSprints = [];
          const allActivities = [];

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
                // Fetch tasks and activities
                const tasksRes = await api.get(`/tasks/project/${ws._id}`);
                if (tasksRes.data.success) {
                  const projectTasks = tasksRes.data.tasks || [];
                  projectTasks.forEach((t) => {
                    allTasks.push({ ...t, workspaceId: ws._id, workspaceTitle: ws.title });

                    if (!t.dueDate) return;
                    const due = new Date(t.dueDate);
                    const isCompleted = t.status === "Completed";

                    if (isCompleted) {
                      if (due >= startOfWeek && due <= endOfToday) {
                        completedTasks.push({ ...t, workspaceId: ws._id, workspaceTitle: ws.title });
                      }
                    } else if (due < startOfToday) {
                      overdueTasks.push({ ...t, workspaceId: ws._id, workspaceTitle: ws.title });
                    } else if (due >= startOfToday && due <= endOfToday) {
                      todayTasks.push({ ...t, workspaceId: ws._id, workspaceTitle: ws.title });
                    } else if (due >= startOfTomorrow && due <= endOfTomorrow) {
                      tomorrowTasks.push({ ...t, workspaceId: ws._id, workspaceTitle: ws.title });
                    }
                  });

                  if (tasksRes.data.activities) {
                    tasksRes.data.activities.forEach((act) => {
                      allActivities.push({ ...act, workspaceTitle: ws.title, workspaceId: ws._id });
                    });
                  }
                }

                // Fetch Sprints
                const sprintsRes = await sprintService.getProjectSprints(ws._id);
                if (sprintsRes.data.success && sprintsRes.data.sprints) {
                  sprintsRes.data.sprints.forEach((sp) => {
                    allSprints.push({ ...sp, workspaceTitle: ws.title, workspaceId: ws._id });
                  });
                }
              } catch (err) {
                console.error("Error fetching data for workspace:", ws.title, err);
              }
            })
          );

          setTasks(allTasks);
          setSprints(allSprints);
          
          // Sort activities newest first
          allActivities.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          setRecentActivities(allActivities.slice(0, 8));

          setDeadlines({
            today: todayTasks,
            tomorrow: tomorrowTasks,
            overdue: overdueTasks,
            completedThisWeek: completedTasks,
          });
        }
      } catch (err) {
        console.error("Dashboard data load error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Compute key stats
  const totalProjects = workspaces.length;
  const inProgressTasks = tasks.filter((t) => t.status === "In Progress").length;
  const completedTasksCount = tasks.filter((t) => t.status === "Completed").length;
  const totalTasksCount = tasks.length;
  const completionRate = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;
  const activeSprints = sprints.filter((s) => s.status === "active");

  const filteredTasksList = (() => {
    if (taskFilter === "today") return deadlines.today;
    if (taskFilter === "tomorrow") return deadlines.tomorrow;
    if (taskFilter === "overdue") return deadlines.overdue;
    if (taskFilter === "in_progress") return tasks.filter((t) => t.status === "In Progress");
    if (taskFilter === "completed") return deadlines.completedThisWeek;
    return tasks.slice(0, 10);
  })();

  const quickActions = [
    {
      title: "Post New Project",
      desc: "Assemble teammates for hackathons or startups",
      icon: (
        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      ),
      path: "/projects/new",
      isPrimary: true
    },
    {
      title: "Browse Projects",
      desc: "Find open listings matching your skillset",
      icon: (
        <svg className="w-5 h-5 text-charcoal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
      path: "/projects",
    },
    {
      title: "Find Teammates",
      desc: "Search student developers & designers",
      icon: (
        <svg className="w-5 h-5 text-charcoal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      path: "/users",
    },
    {
      title: "My Applications",
      desc: "Check responses from project leads",
      icon: (
        <svg className="w-5 h-5 text-charcoal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      path: "/applications",
    },
  ];

  return (
    <div className="min-h-screen bg-bg-base text-text-primary pt-28 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* ─── 1. WELCOME SECTION ─────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-card-surface border border-border-slate rounded-card p-6 md:p-8 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-6"
        >
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-widest text-primary bg-primary-tint px-3 py-1 rounded-full border border-primary/20">
                Student Workspace Hub
              </span>
              <span className="text-xs font-medium text-text-muted">
                {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
              </span>
            </div>
            <h1 className="text-2xl md:text-4xl font-black text-charcoal tracking-tight">
              Welcome back, <span className="text-primary">{user?.name || "Builder"}</span>!
            </h1>
            <p className="text-text-muted text-xs md:text-sm">
              {user?.college ? `${user.college} ` : ""}{user?.branch ? `• ${user.branch} ` : ""}{user?.year ? `• ${user.year}` : ""}
            </p>
          </div>

          {/* Quick Header CTAs */}
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/projects/new"
              className="px-5 py-2.5 rounded-btn text-xs font-bold text-white bg-primary hover:bg-primary-hover shadow-orange-sm transition-all duration-200 flex items-center gap-1.5 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              <span>New Project</span>
            </Link>
            <Link
              to="/calendar"
              className="px-4 py-2.5 rounded-btn text-xs font-bold text-charcoal bg-[#F8F5EF] hover:bg-white border border-border-slate transition-all flex items-center gap-1.5"
            >
              <svg className="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Deadlines Calendar</span>
            </Link>
            <button
              onClick={logout}
              className="px-4 py-2.5 rounded-btn text-xs font-bold text-danger hover:bg-red-50 border border-border-slate transition-all cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </motion.div>

        {/* ─── 2. PROJECT STATISTICS CARDS ─────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-card-surface border border-border-slate rounded-card p-5 shadow-subtle space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-text-muted">Active Workspaces</span>
              <div className="w-8 h-8 rounded-lg bg-primary-tint text-primary flex items-center justify-center font-bold text-xs">
                📁
              </div>
            </div>
            <div className="text-3xl font-black text-charcoal">{totalProjects}</div>
            <p className="text-[11px] text-text-muted">Enrolled team workspaces</p>
          </div>

          <div className="bg-card-surface border border-border-slate rounded-card p-5 shadow-subtle space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-text-muted">Tasks In Progress</span>
              <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center font-bold text-xs">
                ⚡
              </div>
            </div>
            <div className="text-3xl font-black text-sky-600">{inProgressTasks}</div>
            <p className="text-[11px] text-text-muted">{deadlines.overdue.length} overdue tasks</p>
          </div>

          <div className="bg-card-surface border border-border-slate rounded-card p-5 shadow-subtle space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-text-muted">Active Sprints</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-xs">
                🏃
              </div>
            </div>
            <div className="text-3xl font-black text-amber-600">{activeSprints.length}</div>
            <p className="text-[11px] text-text-muted">Across active projects</p>
          </div>

          <div className="bg-card-surface border border-border-slate rounded-card p-5 shadow-subtle space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-text-muted">Overall Velocity</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs">
                ✓
              </div>
            </div>
            <div className="text-3xl font-black text-emerald-600">{completionRate}%</div>
            <p className="text-[11px] text-text-muted">{completedTasksCount} of {totalTasksCount} tasks closed</p>
          </div>
        </div>

        {/* ─── 3. MAIN DASHBOARD CONTENT GRID ─────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT 8 COLUMNS: Active Projects, Sprints & Tasks Overview */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Active Projects List */}
            <div className="bg-card-surface border border-border-slate rounded-card p-6 shadow-subtle space-y-5">
              <div className="flex items-center justify-between border-b border-border-slate pb-4">
                <div>
                  <h2 className="text-lg font-black text-charcoal">Active Workspaces & Sprints</h2>
                  <p className="text-xs text-text-muted mt-0.5">Your active team repositories and Kanban boards</p>
                </div>
                <Link
                  to="/projects"
                  className="text-xs font-bold text-primary hover:text-primary-hover transition-colors"
                >
                  Explore More ➔
                </Link>
              </div>

              {loading ? (
                <div className="py-12 flex justify-center">
                  <div className="w-7 h-7 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : workspaces.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-primary-tint text-primary text-xl mx-auto flex items-center justify-center">
                    📋
                  </div>
                  <h4 className="text-sm font-bold text-charcoal">You haven't joined any workspaces yet</h4>
                  <p className="text-xs text-text-muted max-w-sm mx-auto">
                    Create your own project listing or apply to join active student hackathon teams.
                  </p>
                  <div className="pt-2 flex justify-center gap-3">
                    <Link
                      to="/projects/new"
                      className="px-4 py-2 rounded-btn text-xs font-bold text-white bg-primary hover:bg-primary-hover shadow-orange-sm"
                    >
                      Create Project
                    </Link>
                    <Link
                      to="/projects"
                      className="px-4 py-2 rounded-btn text-xs font-bold text-charcoal bg-[#F8F5EF] hover:bg-white border border-border-slate"
                    >
                      Browse Projects
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {workspaces.map((ws) => {
                    const wsTasks = tasks.filter((t) => t.workspaceId === ws._id);
                    const wsCompleted = wsTasks.filter((t) => t.status === "Completed").length;
                    const wsTotal = wsTasks.length;
                    const wsPercent = wsTotal > 0 ? Math.round((wsCompleted / wsTotal) * 100) : 0;
                    const wsSprint = sprints.find((s) => s.workspaceId === ws._id && s.status === "active");

                    return (
                      <div
                        key={ws._id}
                        className="p-5 rounded-card bg-[#FAF8F4] border border-border-slate hover:border-primary/50 transition-all flex flex-col justify-between space-y-4 group"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white border border-border-slate text-charcoal">
                              {ws.category || "Workspace"}
                            </span>
                            {wsSprint && (
                              <span className="text-[10px] font-bold text-primary bg-primary-tint px-2 py-0.5 rounded-full border border-primary/20">
                                {wsSprint.name}
                              </span>
                            )}
                          </div>
                          <h3 className="font-extrabold text-charcoal text-base group-hover:text-primary transition-colors line-clamp-1">
                            {ws.title}
                          </h3>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[11px] font-semibold text-text-muted">
                            <span>Sprint Progress</span>
                            <span className="text-charcoal font-bold">{wsPercent}% ({wsCompleted}/{wsTotal})</span>
                          </div>
                          <div className="w-full bg-white h-2 rounded-full overflow-hidden border border-border-slate">
                            <div
                              className="bg-primary h-full rounded-full transition-all duration-300"
                              style={{ width: `${wsPercent}%` }}
                            />
                          </div>
                        </div>

                        {/* Action Link */}
                        <div className="pt-2 border-t border-border-slate/80 flex items-center justify-between">
                          <span className="text-[10px] text-text-muted font-medium">
                            {wsTasks.length} total tasks
                          </span>
                          <Link
                            to={`/workspace/${ws._id}`}
                            className="text-xs font-bold text-primary hover:text-primary-hover flex items-center gap-1 group/btn"
                          >
                            <span>Open Board</span>
                            <svg className="w-3.5 h-3.5 transform group-hover/btn:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                            </svg>
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Tasks Overview Section */}
            <div className="bg-card-surface border border-border-slate rounded-card p-6 shadow-subtle space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-slate pb-4">
                <div>
                  <h2 className="text-lg font-black text-charcoal">Tasks Overview</h2>
                  <p className="text-xs text-text-muted mt-0.5">Track deliverables, sprint milestones, and deadlines</p>
                </div>
                
                {/* Filter Pills */}
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: "all", label: "All Tasks" },
                    { id: "today", label: `Due Today (${deadlines.today.length})` },
                    { id: "tomorrow", label: `Tomorrow (${deadlines.tomorrow.length})` },
                    { id: "overdue", label: `Overdue (${deadlines.overdue.length})` },
                    { id: "in_progress", label: "In Progress" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setTaskFilter(tab.id)}
                      className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                        taskFilter === tab.id
                          ? "bg-primary text-white shadow-orange-sm"
                          : "bg-[#F8F5EF] text-text-secondary hover:text-charcoal border border-border-slate"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {filteredTasksList.length === 0 ? (
                <div className="py-12 text-center text-text-muted text-xs">
                  <div className="w-10 h-10 rounded-full bg-[#F8F5EF] mx-auto mb-2 flex items-center justify-center text-base">
                    ✓
                  </div>
                  <span className="font-semibold text-charcoal block">No tasks in this category</span>
                  <span>Select another filter to view sprint items.</span>
                </div>
              ) : (
                <div className="divide-y divide-border-slate/70">
                  {filteredTasksList.map((task) => (
                    <div
                      key={task._id}
                      className="py-3.5 flex items-center justify-between gap-4 hover:bg-[#FBF8F3] px-2 rounded-lg transition-colors group"
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase border shrink-0 ${
                            task.priority === "High"
                              ? "bg-primary-tint text-primary border-primary/20"
                              : task.priority === "Medium"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-sky-50 text-sky-700 border-sky-200"
                          }`}>
                            {task.priority || "Normal"}
                          </span>
                          <span className={`text-xs font-bold truncate ${task.status === "Completed" ? "line-through text-text-muted" : "text-charcoal"}`}>
                            {task.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-text-muted">
                          <span className="font-medium text-text-secondary">
                            📁 {task.workspaceTitle}
                          </span>
                          {task.dueDate && (
                            <span>
                              📅 Due {new Date(task.dueDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          task.status === "Completed"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : task.status === "In Progress"
                            ? "bg-sky-50 text-sky-700 border border-sky-200"
                            : "bg-[#F8F5EF] text-text-secondary border border-border-slate"
                        }`}>
                          {task.status}
                        </span>
                        <Link
                          to={`/workspace/${task.workspaceId}`}
                          className="text-xs font-bold text-primary hover:text-primary-hover opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          View ➔
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* RIGHT 4 COLUMNS: Quick Actions, Profile Status, Deadlines & Recent Activity */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Quick Actions Card Grid */}
            <div className="bg-card-surface border border-border-slate rounded-card p-6 shadow-subtle space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-charcoal">
                Quick Shortcuts
              </h3>
              <div className="grid grid-cols-1 gap-2.5">
                {quickActions.map((qa) => (
                  <Link
                    key={qa.title}
                    to={qa.path}
                    className={`p-3.5 rounded-card border transition-all flex items-center justify-between group ${
                      qa.isPrimary
                        ? "bg-primary-tint border-primary/30 hover:border-primary"
                        : "bg-[#FAF8F4] border-border-slate hover:bg-white hover:border-primary/40"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-white border border-border-slate flex items-center justify-center shrink-0 shadow-subtle">
                        {qa.icon}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-charcoal group-hover:text-primary transition-colors">
                          {qa.title}
                        </h4>
                        <p className="text-[10px] text-text-muted">{qa.desc}</p>
                      </div>
                    </div>
                    <svg className="w-4 h-4 text-text-muted group-hover:translate-x-0.5 group-hover:text-primary transition-all shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                ))}
              </div>
            </div>

            {/* Profile Status Summary */}
            <div className="bg-card-surface border border-border-slate rounded-card p-6 shadow-subtle space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border-slate">
                <h3 className="text-xs font-bold uppercase tracking-wider text-charcoal">
                  My Profile Status
                </h3>
                <Link to="/profile" className="text-xs font-bold text-primary hover:text-primary-hover">
                  Edit ➔
                </Link>
              </div>

              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-full bg-charcoal text-white flex items-center justify-center font-black text-sm shadow-subtle shrink-0">
                  {user?.name ? user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "TF"}
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-charcoal truncate">{user?.name}</h4>
                  <p className="text-xs text-text-muted truncate">{user?.email}</p>
                </div>
              </div>

              <div className="space-y-3 pt-2 text-xs border-t border-border-slate">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block">University</span>
                  <span className="text-charcoal font-semibold">{user?.college || "Not set yet"}</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block">Branch</span>
                    <span className="text-charcoal font-semibold">{user?.branch || "Not set"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block">Year</span>
                    <span className="text-charcoal font-semibold">{user?.year || "Not set"}</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block mb-1.5">Skills</span>
                  {user?.skills && user.skills.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {user.skills.map((s) => (
                        <span key={s} className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#F8F5EF] border border-border-slate text-charcoal">
                          {s}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <Link to="/profile" className="text-xs text-primary font-bold hover:underline">
                      + Add skills to boost team invites
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {/* Recent Activity Feed */}
            <div className="bg-card-surface border border-border-slate rounded-card p-6 shadow-subtle space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border-slate">
                <h3 className="text-xs font-bold uppercase tracking-wider text-charcoal">
                  Recent Activity Stream
                </h3>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>

              {recentActivities.length === 0 ? (
                <div className="py-6 text-center text-xs text-text-muted">
                  No recent workspace actions logged yet.
                </div>
              ) : (
                <div className="space-y-3 text-xs">
                  {recentActivities.map((act, i) => (
                    <div key={act._id || i} className="flex gap-2.5 items-start">
                      <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-text-secondary leading-snug">
                          <strong className="text-charcoal font-bold">{act.user?.name || "Member"}</strong>{" "}
                          {act.action}
                        </p>
                        <span className="text-[10px] text-text-muted block mt-0.5">
                          {act.workspaceTitle} • {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

export default Dashboard;
