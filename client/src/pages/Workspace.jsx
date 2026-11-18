import { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { getProjectById } from "../services/projectService";
import api from "../services/api";
import {
  getProjectTasks,
  createTask,
  updateTask,
  deleteTask,
  updateTaskStatus,
} from "../services/taskService";
import {
  getProjectResources,
  createResource,
  deleteResource,
} from "../services/resourceService";
import { formatDate } from "../utils/helpers";
import AiAssistant from "../components/workspace/AiAssistant";
import GitHubTab from "../components/workspace/GitHubTab";
import Documents from "../components/workspace/Documents";
import TaskAttachments from "../components/workspace/TaskAttachments";
import { getProjectAttachments } from "../services/attachmentService";
import TaskComments from "../components/workspace/TaskComments";
import sprintService from "../services/sprintService";

const Workspace = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, isAuthenticated } = useAuth();
  const { socket, isConnected, onlineMembers, setOnlineMembers } = useSocket();

  // Project & Member states
  const [project, setProject] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Tab & Data states
  const [activeTab, setActiveTab] = useState("tasks");
  const [tasks, setTasks] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [resources, setResources] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [activities, setActivities] = useState([]);

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");

  // Modals / Form toggles
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [taskFormData, setTaskFormData] = useState({
    title: "",
    description: "",
    assignedTo: "",
    priority: "Medium",
    dueDate: "",
    startDate: "",
    sprint: ""
  });

  // Task Details Modal
  const [activeDetailTask, setActiveDetailTask] = useState(null);
  const [detailTab, setDetailTab] = useState("overview");

  // Sprint Modal
  const [isSprintModalOpen, setIsSprintModalOpen] = useState(false);
  const [sprintFormData, setSprintFormData] = useState({
    name: "",
    goal: "",
    startDate: "",
    endDate: ""
  });

  const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);
  const [resourceFormData, setResourceFormData] = useState({
    fileName: "",
    fileUrl: "",
    type: "Link",
  });

  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  // ─── 1. FETCH WORKSPACE INITIALIZER ───────────────────────────────────────
  const fetchWorkspaceData = async () => {
    try {
      setLoading(true);
      setError("");

      const projectData = await getProjectById(projectId);
      if (!projectData.success) {
        throw new Error("Project details not found");
      }
      const proj = projectData.project;
      setProject(proj);

      const tasksData = await getProjectTasks(projectId);
      setTasks(tasksData.tasks);
      setActivities(tasksData.activities);

      const resourcesData = await getProjectResources(projectId);
      setResources(resourcesData.resources);

      const attachData = await getProjectAttachments(projectId, 1, 9999);
      if (attachData.success) {
        setAttachments(attachData.attachments);
      }

      const sprintsData = await sprintService.getProjectSprints(projectId);
      if (sprintsData.data.success) {
        setSprints(sprintsData.data.sprints);
      }

    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || "Access Denied: You are not authorized to view this workspace.");
    } finally {
      setLoading(false);
    }
  };

  const [timeTicker, setTimeTicker] = useState(Date.now());

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    fetchWorkspaceData();

    const interval = setInterval(() => {
      setTimeTicker(Date.now());
    }, 15000);

    return () => clearInterval(interval);
  }, [projectId, isAuthenticated]);

  // ─── 2. SOCKET.IO ROOM REGISTRATION & SYNC ──────────────────────────────
  useEffect(() => {
    if (!socket || !project) return;

    socket.emit("join_project_room", { projectId });

    const handleUserOnline = (presence) => {
      setOnlineMembers((prev) => {
        if (prev.some((o) => o.userId === presence.userId)) {
          return prev.map((o) => (o.userId === presence.userId ? presence : o));
        }
        return [...prev, presence];
      });
    };

    const handleUserOffline = ({ userId, lastSeen }) => {
      setOnlineMembers((prev) =>
        prev.map((o) => (o.userId === userId ? { ...o, connectedAt: null, lastSeen } : o))
      );
    };

    const handleOnlineMembersList = (membersList) => {
      setOnlineMembers(membersList);
    };

    const handleTaskCreated = (newTask) => {
      setTasks((prev) => {
        if (prev.some((t) => t._id === newTask._id)) return prev;
        return [newTask, ...prev];
      });
    };

    const handleTaskUpdated = (updatedTask) => {
      setTasks((prev) =>
        prev.map((t) => (t._id === updatedTask.taskId ? { ...t, ...updatedTask, _id: updatedTask.taskId } : t))
      );
      if (activeDetailTask && activeDetailTask._id === updatedTask.taskId) {
        setActiveDetailTask((prev) => ({ ...prev, ...updatedTask }));
      }
    };

    const handleTaskDeleted = ({ taskId: deletedId }) => {
      setTasks((prev) => prev.filter((t) => t._id !== deletedId));
      if (activeDetailTask && activeDetailTask._id === deletedId) {
        setActiveDetailTask(null);
      }
    };

    const handleActivityLogged = (newActivity) => {
      setActivities((prev) => [newActivity, ...prev]);
    };

    const handleSprintUpdated = () => {
      sprintService.getProjectSprints(projectId).then((sprintsData) => {
        if (sprintsData.data.success) {
          setSprints(sprintsData.data.sprints);
        }
      });
    };

    socket.on("user_online", handleUserOnline);
    socket.on("user_offline", handleUserOffline);
    socket.on("online_members", handleOnlineMembersList);
    socket.on("task_created", handleTaskCreated);
    socket.on("task_updated", handleTaskUpdated);
    socket.on("task_deleted", handleTaskDeleted);
    socket.on("activity_logged", handleActivityLogged);
    socket.on("sprint_updated", handleSprintUpdated);

    const fetchTeam = async () => {
      try {
        const teamData = await api.get(`/projects/${projectId}/team`);
        if (teamData.data.success) {
          setTeamMembers(teamData.data.members);
        }
      } catch (e) {
        console.error("Failed to load team list for Workspace:", e.message);
      }
    };
    fetchTeam();

    return () => {
      socket.emit("leave_project_room", { projectId });
      socket.off("user_online", handleUserOnline);
      socket.off("user_offline", handleUserOffline);
      socket.off("online_members", handleOnlineMembersList);
      socket.off("task_created", handleTaskCreated);
      socket.off("task_updated", handleTaskUpdated);
      socket.off("task_deleted", handleTaskDeleted);
      socket.off("activity_logged", handleActivityLogged);
      socket.off("sprint_updated", handleSprintUpdated);
    };
  }, [socket, project, projectId]);

  // Duration parser helpers
  const getDurationText = (connectedAt) => {
    if (!connectedAt) return "Online";
    const diff = Math.floor((timeTicker - new Date(connectedAt).getTime()) / 60000);
    if (diff < 1) return "Joined just now";
    if (diff === 1) return "Active 1 min";
    return `Active ${diff} mins`;
  };

  const getLastSeenText = (lastSeen) => {
    const diff = Math.floor((timeTicker - new Date(lastSeen).getTime()) / 60000);
    if (diff < 1) return "Left just now";
    if (diff === 1) return "Active 1 min ago";
    if (diff < 60) return `Active ${diff} mins ago`;
    const hours = Math.floor(diff / 60);
    if (hours === 1) return "Active 1 hour ago";
    if (hours < 24) return `Active ${hours} hours ago`;
    return `Active on ${new Date(lastSeen).toLocaleDateString()}`;
  };

  // ─── 3. SUBMISSIONS & ACTIONS handlers ──────────────────────────────────
  const handleOpenTaskCreate = () => {
    setEditingTask(null);
    setTaskFormData({
      title: "",
      description: "",
      assignedTo: "",
      priority: "Medium",
      dueDate: "",
      startDate: "",
      sprint: ""
    });
    setFormError("");
    setIsTaskModalOpen(true);
  };

  const handleOpenTaskEdit = (task) => {
    setEditingTask(task);
    setTaskFormData({
      title: task.title,
      description: task.description || "",
      assignedTo: task.assignedTo?._id || task.assignedTo || "",
      priority: task.priority || "Medium",
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "",
      startDate: task.startDate ? new Date(task.startDate).toISOString().split("T")[0] : "",
      sprint: task.sprint || ""
    });
    setFormError("");
    setIsTaskModalOpen(true);
  };

  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    if (!taskFormData.title.trim()) {
      setFormError("Task title is required");
      return;
    }

    try {
      setFormLoading(true);
      setFormError("");

      if (editingTask) {
        await updateTask(editingTask._id, taskFormData);
      } else {
        await createTask(projectId, taskFormData);
      }

      setIsTaskModalOpen(false);
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || "Failed to save task");
    } finally {
      setFormLoading(false);
    }
  };

  const handleTaskStatusChange = async (taskId, nextStatus) => {
    try {
      await updateTaskStatus(taskId, nextStatus);
    } catch (err) {
      console.error("Failed to change task status:", err.message);
    }
  };

  const handleTaskDelete = async (taskId) => {
    if (!window.confirm("Delete this task?")) return;
    try {
      await deleteTask(taskId);
    } catch (err) {
      console.error("Failed to delete task:", err.message);
    }
  };

  const handleSprintSubmit = async (e) => {
    e.preventDefault();
    if (!sprintFormData.name.trim() || !sprintFormData.startDate || !sprintFormData.endDate) {
      setFormError("Please fill in all required fields.");
      return;
    }
    try {
      setFormLoading(true);
      await sprintService.createSprint(projectId, sprintFormData);
      setIsSprintModalOpen(false);
      setSprintFormData({ name: "", goal: "", startDate: "", endDate: "" });
    } catch (err) {
      setFormError(err.message || "Failed to create sprint.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleResourceSubmit = async (e) => {
    e.preventDefault();
    if (!resourceFormData.fileName.trim() || !resourceFormData.fileUrl.trim()) {
      setFormError("Please fill in all fields");
      return;
    }

    try {
      setFormLoading(true);
      setFormError("");

      const res = await createResource(projectId, resourceFormData);
      if (res.success) {
        setIsResourceModalOpen(false);
        setResourceFormData({ fileName: "", fileUrl: "", type: "Link" });
      }
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || "Failed to submit resource Link");
    } finally {
      setFormLoading(false);
    }
  };

  const handleResourceDelete = async (resourceId) => {
    if (!window.confirm("Delete this link?")) return;
    try {
      await deleteResource(resourceId);
    } catch (err) {
      console.error("Failed to delete resource:", err.message);
    }
  };

  // Filter Tasks list
  const getFilteredTasks = () => {
    return tasks.filter((t) => {
      if (
        searchQuery &&
        !t.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !t.description?.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }
      
      const assignedUserId = t.assignedTo?._id || t.assignedTo;
      const currentUserId = currentUser?.id || currentUser?._id;
      
      if (filterType === "me" && String(assignedUserId) !== String(currentUserId)) return false;
      if (filterType === "high" && t.priority !== "High") return false;
      if (filterType === "completed" && t.status !== "Completed") return false;
      if (filterType === "in_progress" && t.status !== "In Progress") return false;
      
      if (filterType === "today") {
        if (!t.dueDate) return false;
        return new Date(t.dueDate).toDateString() === new Date().toDateString();
      }
      
      if (filterType === "overdue") {
        if (!t.dueDate || t.status === "Completed") return false;
        return new Date(t.dueDate) < new Date();
      }

      return true;
    });
  };

  const filteredTaskList = getFilteredTasks();
  const todoTasks = filteredTaskList.filter((t) => t.status === "Todo");
  const inProgressTasks = filteredTaskList.filter((t) => t.status === "In Progress");
  const completedTasks = filteredTaskList.filter((t) => t.status === "Completed");

  const totalTasks = tasks.length;
  const compTasks = tasks.filter((t) => t.status === "Completed").length;
  const pendingTasks = totalTasks - compTasks;
  const progressPercentage = totalTasks > 0 ? Math.round((compTasks / totalTasks) * 100) : 0;

  const averageCompletionTime = (() => {
    const completedWithDates = tasks.filter(t => t.status === "Completed" && t.createdAt && t.updatedAt);
    if (completedWithDates.length === 0) return "N/A";
    const totalDurationMs = completedWithDates.reduce((acc, curr) => {
      const created = new Date(curr.createdAt).getTime();
      const updated = new Date(curr.updatedAt).getTime();
      return acc + (updated - created);
    }, 0);
    const avgHours = Math.round(totalDurationMs / completedWithDates.length / (1000 * 60 * 60));
    return `${avgHours} hrs`;
  })();

  const activeSprint = sprints.find(s => s.status === "active");

  const creatorId = project?.creator?._id || project?.creator;
  const currentUserId = currentUser?._id || currentUser?.id;
  const isCreator =
    creatorId && currentUserId
      ? String(creatorId) === String(currentUserId)
      : false;

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-base flex flex-col items-center justify-center">
        <div className="w-9 h-9 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-text-muted text-xs mt-3 tracking-wider font-semibold animate-pulse">
          Connecting to real-time project workspace...
        </span>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center px-6">
        <div className="text-center max-w-md bg-card-surface p-8 rounded-card border border-border-slate shadow-premium space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-50 text-danger mx-auto flex items-center justify-center text-xl">
            🔒
          </div>
          <h2 className="text-2xl font-black text-charcoal">Workspace Access Restricted</h2>
          <p className="text-text-muted text-sm leading-relaxed">{error || "Access Denied."}</p>
          <Link to="/dashboard" className="inline-flex items-center gap-2 px-6 py-2.5 rounded-btn font-bold text-xs text-white bg-primary hover:bg-primary-hover shadow-orange-sm transition-all">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-base text-text-primary pt-24 pb-8 px-4 md:px-6 relative overflow-hidden flex flex-col md:flex-row gap-6">
      
      {/* ─── LEFT SIDEBAR: TEAM SUMMARY PANEL ────────────────────────────── */}
      <div className="w-full md:w-80 bg-card-surface border border-border-slate rounded-card p-6 flex flex-col shrink-0 gap-6 z-10 self-start shadow-subtle">
        
        {/* Project Title Header */}
        <div className="border-b border-border-slate pb-4">
          <span className="text-[10px] font-bold text-primary uppercase tracking-widest bg-primary-tint px-2.5 py-1 rounded-full border border-primary/20">
            {project.category}
          </span>
          <h1 className="text-xl font-black mt-3 tracking-tight text-charcoal leading-tight truncate">
            {project.title}
          </h1>
          <p className="text-xs text-text-muted mt-1 font-medium">Workspace Board & Sprints</p>
        </div>

        {/* Progress Gauge */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-text-muted font-medium">Task Completion</span>
            <span className="text-charcoal font-bold">{progressPercentage}% ({compTasks}/{totalTasks})</span>
          </div>
          <div className="w-full bg-[#F8F5EF] h-2.5 rounded-full overflow-hidden border border-border-slate">
            <div
              className="bg-primary h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Quick Statistics */}
        <div className="grid grid-cols-2 gap-3 text-center border-t border-b border-border-slate py-4">
          <div className="bg-[#FAF8F4] p-3 rounded-card border border-border-slate">
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block">Pending</span>
            <span className="text-base font-black text-amber-600 block mt-0.5">{pendingTasks}</span>
          </div>
          <div className="bg-[#FAF8F4] p-3 rounded-card border border-border-slate">
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block">Resources</span>
            <span className="text-base font-black text-primary block mt-0.5">{resources.length}</span>
          </div>
        </div>

        {/* Team Members List / Live User Presence */}
        <div className="space-y-3.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-charcoal">
              Team Presence ({teamMembers.length})
            </h3>
            <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              {teamMembers.filter(m => onlineMembers.some(o => o.userId === m._id.toString() && o.connectedAt)).length} Online
            </span>
          </div>

          <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
            {[...teamMembers]
              .sort((a, b) => {
                if (a.role === "Creator") return -1;
                if (b.role === "Creator") return 1;
                return 0;
              })
              .map((member) => {
                const isLead = member.role === "Creator";
                const presence = onlineMembers.find((o) => o.userId === member._id.toString());
                const isOnline = presence && !!presence.connectedAt;

                const initials = member.name
                  ? member.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)
                  : "TF";

                return (
                  <div key={member._id} className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-[#FAF8F4] transition-colors">
                    <div className="relative shrink-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                        isLead ? "bg-charcoal text-white" : "bg-primary-tint text-primary border border-primary/20"
                      }`}>
                        {initials}
                      </div>
                      <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${
                        isOnline ? "bg-emerald-500 animate-pulse" : "bg-gray-300"
                      }`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-charcoal truncate flex items-center gap-1.5">
                        <span className="truncate">{member.name}</span>
                        {isLead && (
                          <span className="text-[9px] bg-primary-tint text-primary border border-primary/20 px-1.5 py-0.2 rounded font-bold shrink-0">
                            Lead
                          </span>
                        )}
                      </h4>
                      {isOnline ? (
                        <p className="text-[10px] text-emerald-600 font-semibold truncate">
                          {getDurationText(presence.connectedAt)}
                        </p>
                      ) : (
                        <p className="text-[10px] text-text-muted truncate">
                          {presence?.lastSeen ? getLastSeenText(presence.lastSeen) : "Offline"}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Workspace Quick Links */}
        <div className="pt-2 border-t border-border-slate space-y-2">
          <Link
            to="/chat"
            className="w-full text-center block py-2.5 rounded-btn text-xs font-bold text-charcoal bg-[#F8F5EF] hover:bg-white border border-border-slate transition-all"
          >
            Open Project Chat
          </Link>
          <Link
            to={`/projects/${projectId}`}
            className="w-full text-center block py-2.5 rounded-btn text-xs font-bold text-text-muted hover:text-charcoal transition-colors"
          >
            View Public Listing
          </Link>
        </div>
      </div>

      {/* ─── RIGHT MAIN PANEL: TABS AREA ─────────────────────────────────── */}
      <div className="flex-1 bg-card-surface border border-border-slate rounded-card p-4 sm:p-6 flex flex-col z-10 min-w-0 min-h-[70vh] md:h-[86vh] shadow-subtle">
        
        {/* Workspace Tabs Navigation Bar */}
        <div className="flex border-b border-border-slate gap-6 mb-6 text-sm shrink-0 overflow-x-auto scrollbar-none">
          {[
            { id: "tasks", label: "Tasks Kanban" },
            { id: "sprints", label: "Sprint Cycles" },
            { id: "productivity", label: "Analytics" },
            { id: "resources", label: "Resources" },
            { id: "activity", label: "Activity Log" },
            { id: "ai", label: "AI Copilot" },
            { id: "github", label: "GitHub Sync" },
            { id: "documents", label: "Documents" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3.5 font-bold text-xs uppercase tracking-wider relative cursor-pointer whitespace-nowrap transition-colors ${
                activeTab === tab.id ? "text-primary" : "text-text-muted hover:text-charcoal"
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <motion.div layoutId="activeWorkspaceTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
          ))}
        </div>

        {/* Dynamic Workspace Content Area */}
        <div className="flex-1 overflow-y-auto min-h-0 pr-1">
          
          {/* TAB 1: KANBAN TASKS BOARD */}
          {activeTab === "tasks" && (
            <div className="h-full flex flex-col space-y-4">
              
              {/* Filter & Action Row */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shrink-0 bg-[#FAF8F4] border border-border-slate p-3.5 rounded-card">
                <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search tasks..."
                    className="bg-white border border-border-slate focus:border-primary rounded-input px-3 py-1.5 text-xs text-charcoal outline-none w-full sm:w-48 placeholder:text-text-muted"
                  />
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="bg-white border border-border-slate focus:border-primary rounded-input px-3 py-1.5 text-xs text-charcoal outline-none cursor-pointer"
                  >
                    <option value="all">All Tasks</option>
                    <option value="me">Assigned to Me</option>
                    <option value="high">High Priority</option>
                    <option value="today">Due Today</option>
                    <option value="overdue">Overdue</option>
                    <option value="completed">Completed</option>
                    <option value="in_progress">In Progress</option>
                  </select>
                </div>
                
                <button
                  onClick={handleOpenTaskCreate}
                  className="px-4 py-2 rounded-btn bg-primary hover:bg-primary-hover text-xs font-bold text-white shadow-orange-sm transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span>+ Create Task</span>
                </button>
              </div>

              {/* Kanban Status Columns Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 flex-grow overflow-y-auto pt-1">
                
                {/* Column 1: TODO */}
                <div className="bg-[#FAF8F4] border border-border-slate rounded-card p-4 flex flex-col gap-3 min-h-[340px]">
                  <div className="flex justify-between items-center border-b border-border-slate pb-2.5">
                    <span className="text-xs font-bold text-charcoal uppercase tracking-wider">To Do</span>
                    <span className="text-xs bg-white text-charcoal border border-border-slate px-2 py-0.5 rounded-full font-bold">
                      {todoTasks.length}
                    </span>
                  </div>
                  <div className="space-y-3 overflow-y-auto flex-grow pr-1">
                    {todoTasks.map((t) => (
                      <TaskCard
                        key={t._id}
                        task={t}
                        onEdit={handleOpenTaskEdit}
                        onDelete={handleTaskDelete}
                        onStatusChange={handleTaskStatusChange}
                        onDetailClick={() => {
                          setActiveDetailTask(t);
                          setDetailTab("overview");
                        }}
                        attachmentCount={attachments.filter(a => a.task === t._id).length}
                      />
                    ))}
                  </div>
                </div>

                {/* Column 2: IN PROGRESS */}
                <div className="bg-[#FAF8F4] border border-border-slate rounded-card p-4 flex flex-col gap-3 min-h-[340px]">
                  <div className="flex justify-between items-center border-b border-border-slate pb-2.5">
                    <span className="text-xs font-bold text-sky-700 uppercase tracking-wider">In Progress</span>
                    <span className="text-xs bg-sky-50 text-sky-700 border border-sky-200 px-2 py-0.5 rounded-full font-bold">
                      {inProgressTasks.length}
                    </span>
                  </div>
                  <div className="space-y-3 overflow-y-auto flex-grow pr-1">
                    {inProgressTasks.map((t) => (
                      <TaskCard
                        key={t._id}
                        task={t}
                        onEdit={handleOpenTaskEdit}
                        onDelete={handleTaskDelete}
                        onStatusChange={handleTaskStatusChange}
                        onDetailClick={() => {
                          setActiveDetailTask(t);
                          setDetailTab("overview");
                        }}
                        attachmentCount={attachments.filter(a => a.task === t._id).length}
                      />
                    ))}
                  </div>
                </div>

                {/* Column 3: COMPLETED */}
                <div className="bg-[#FAF8F4] border border-border-slate rounded-card p-4 flex flex-col gap-3 min-h-[340px]">
                  <div className="flex justify-between items-center border-b border-border-slate pb-2.5">
                    <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Completed</span>
                    <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                      {completedTasks.length}
                    </span>
                  </div>
                  <div className="space-y-3 overflow-y-auto flex-grow pr-1">
                    {completedTasks.map((t) => (
                      <TaskCard
                        key={t._id}
                        task={t}
                        onEdit={handleOpenTaskEdit}
                        onDelete={handleTaskDelete}
                        onStatusChange={handleTaskStatusChange}
                        onDetailClick={() => {
                          setActiveDetailTask(t);
                          setDetailTab("overview");
                        }}
                        attachmentCount={attachments.filter(a => a.task === t._id).length}
                      />
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 2: SPRINTS PLANNING */}
          {activeTab === "sprints" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center pb-3 border-b border-border-slate">
                <div>
                  <h2 className="text-base font-black text-charcoal">Sprint Management</h2>
                  <p className="text-xs text-text-muted">Organize deliverables into focused agile milestones</p>
                </div>
                <button
                  onClick={() => setIsSprintModalOpen(true)}
                  className="px-4 py-2 rounded-btn bg-primary hover:bg-primary-hover text-xs font-bold text-white shadow-orange-sm transition-colors cursor-pointer"
                >
                  + Create Sprint
                </button>
              </div>

              {sprints.length === 0 ? (
                <div className="text-center py-16 bg-[#FAF8F4] border border-border-slate rounded-card space-y-3">
                  <div className="w-12 h-12 rounded-full bg-primary-tint text-primary text-xl mx-auto flex items-center justify-center">
                    🏃
                  </div>
                  <h4 className="text-sm font-bold text-charcoal">No sprints initiated yet</h4>
                  <p className="text-xs text-text-muted max-w-sm mx-auto">
                    Create a sprint cycle with start and end dates to track team burndown.
                  </p>
                  <button
                    onClick={() => setIsSprintModalOpen(true)}
                    className="px-4 py-2 rounded-btn bg-primary hover:bg-primary-hover text-xs font-bold text-white shadow-orange-sm cursor-pointer"
                  >
                    Start First Sprint
                  </button>
                </div>
              ) : (
                <div className="space-y-5">
                  {sprints.map((sprint) => {
                    const isSprintActive = sprint.status === "active";
                    return (
                      <div key={sprint._id} className="bg-[#FAF8F4] border border-border-slate rounded-card p-5 space-y-4 shadow-subtle">
                        <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
                          <div>
                            <div className="flex items-center gap-2.5">
                              <h3 className="font-extrabold text-charcoal text-base">{sprint.name}</h3>
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold border tracking-wider ${
                                sprint.status === "active" ? "bg-emerald-50 border-emerald-200 text-emerald-700" :
                                sprint.status === "completed" ? "bg-gray-100 border-gray-300 text-gray-600" :
                                "bg-primary-tint border-primary/20 text-primary"
                              }`}>
                                {sprint.status}
                              </span>
                            </div>
                            <p className="text-text-secondary text-xs mt-1">{sprint.goal || "No specific goal specified"}</p>
                            <span className="text-[11px] text-text-muted font-medium block mt-1.5">
                              🗓️ {new Date(sprint.startDate).toLocaleDateString()} — {new Date(sprint.endDate).toLocaleDateString()}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {sprint.status === "planned" && (
                              <button
                                onClick={async () => {
                                  await sprintService.updateSprint(sprint._id, { status: "active" });
                                  fetchWorkspaceData();
                                }}
                                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-btn text-xs font-bold cursor-pointer"
                              >
                                Start Sprint
                              </button>
                            )}
                            {sprint.status === "active" && (
                              <button
                                onClick={async () => {
                                  await sprintService.updateSprint(sprint._id, { status: "completed" });
                                  fetchWorkspaceData();
                                }}
                                className="px-3.5 py-1.5 bg-charcoal hover:bg-black text-white rounded-btn text-xs font-bold cursor-pointer"
                              >
                                Complete Sprint
                              </button>
                            )}
                            <button
                              onClick={async () => {
                                if (window.confirm("Delete this sprint cycle?")) {
                                  await sprintService.deleteSprint(sprint._id);
                                  fetchWorkspaceData();
                                }
                              }}
                              className="px-3 py-1.5 border border-border-slate text-danger hover:bg-red-50 rounded-btn text-xs font-bold cursor-pointer"
                            >
                              Delete
                            </button>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1.5 pt-2 border-t border-border-slate">
                          <div className="flex justify-between text-xs font-semibold text-text-muted">
                            <span>Sprint Completion Rate</span>
                            <span className="text-charcoal font-bold">{sprint.stats?.completionRate || 0}% ({sprint.stats?.completedTasks || 0}/{sprint.stats?.totalTasks || 0} Tasks)</span>
                          </div>
                          <div className="w-full bg-white h-2 rounded-full overflow-hidden border border-border-slate">
                            <div className="bg-primary h-full rounded-full transition-all" style={{ width: `${sprint.stats?.completionRate || 0}%` }} />
                          </div>
                        </div>

                        {/* Tasks in Sprint list */}
                        <div className="space-y-2 pt-2">
                          <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">Sprint Backlog Items</span>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                            {tasks.filter(t => t.sprint === sprint._id).map(t => (
                              <div key={t._id} className="p-2.5 bg-white border border-border-slate rounded-lg flex justify-between items-center text-xs shadow-subtle">
                                <span className="truncate font-semibold text-charcoal max-w-[200px]">{t.title}</span>
                                <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase font-bold border ${
                                  t.status === "Completed" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-amber-50 border-amber-200 text-amber-700"
                                }`}>
                                  {t.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PRODUCTIVITY ANALYTICS */}
          {activeTab === "productivity" && (
            <div className="space-y-6">
              <h2 className="text-base font-black text-charcoal pb-3 border-b border-border-slate">
                Workspace Productivity Metrics
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                <div className="bg-[#FAF8F4] border border-border-slate p-5 rounded-card shadow-subtle space-y-2">
                  <span className="text-[10px] text-text-muted block uppercase font-bold tracking-wider">Tasks Completed</span>
                  <span className="text-3xl font-black text-emerald-600 block">{compTasks}</span>
                  <span className="text-xs text-text-muted">Out of {totalTasks} sprint items</span>
                </div>
                
                <div className="bg-[#FAF8F4] border border-border-slate p-5 rounded-card shadow-subtle space-y-2">
                  <span className="text-[10px] text-text-muted block uppercase font-bold tracking-wider">Tasks Remaining</span>
                  <span className="text-3xl font-black text-amber-600 block">{pendingTasks}</span>
                  <span className="text-xs text-text-muted">Active in sprint backlog</span>
                </div>

                <div className="bg-[#FAF8F4] border border-border-slate p-5 rounded-card shadow-subtle space-y-2">
                  <span className="text-[10px] text-text-muted block uppercase font-bold tracking-wider">Completion Velocity</span>
                  <span className="text-3xl font-black text-primary block">{progressPercentage}%</span>
                  <span className="text-xs text-text-muted">Sprint burn rate</span>
                </div>

                <div className="bg-[#FAF8F4] border border-border-slate p-5 rounded-card shadow-subtle space-y-2">
                  <span className="text-[10px] text-text-muted block uppercase font-bold tracking-wider">Avg Completion Time</span>
                  <span className="text-3xl font-black text-charcoal block">{averageCompletionTime}</span>
                  <span className="text-xs text-text-muted">Lead time from creation to close</span>
                </div>

                <div className="bg-[#FAF8F4] border border-border-slate p-5 rounded-card shadow-subtle space-y-2">
                  <span className="text-[10px] text-text-muted block uppercase font-bold tracking-wider">Active Sprint</span>
                  {activeSprint ? (
                    <div>
                      <span className="text-lg font-bold text-charcoal block truncate">{activeSprint.name}</span>
                      <span className="text-xs text-text-muted block truncate mt-1">Goal: {activeSprint.goal || "None"}</span>
                    </div>
                  ) : (
                    <span className="text-xs italic text-text-muted block mt-2">No active sprint cycle</span>
                  )}
                </div>

                <div className="bg-[#FAF8F4] border border-border-slate p-5 rounded-card shadow-subtle space-y-2">
                  <span className="text-[10px] text-text-muted block uppercase font-bold tracking-wider">Collaborators Present</span>
                  <span className="text-3xl font-black text-charcoal block">
                    {onlineMembers.filter(o => o.connectedAt).length}
                  </span>
                  <span className="text-xs text-emerald-600 font-semibold">Active in workspace socket room</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: RESOURCES BOARD */}
          {activeTab === "resources" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center pb-3 border-b border-border-slate">
                <div>
                  <h2 className="text-base font-black text-charcoal">Project Resource Links</h2>
                  <p className="text-xs text-text-muted">Figma designs, drive folders, and API specifications</p>
                </div>
                <button
                  onClick={() => setIsResourceModalOpen(true)}
                  className="px-4 py-2 rounded-btn bg-primary hover:bg-primary-hover text-xs font-bold text-white shadow-orange-sm transition-colors cursor-pointer"
                >
                  + Add Resource Link
                </button>
              </div>

              {resources.length === 0 ? (
                <div className="text-center py-16 bg-[#FAF8F4] border border-border-slate rounded-card space-y-2">
                  <span className="text-2xl block">📁</span>
                  <p className="text-text-muted text-xs">No resources linked for this project yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {resources.map((res) => (
                    <div
                      key={res._id}
                      className="bg-[#FAF8F4] border border-border-slate hover:border-primary/50 rounded-card p-4 flex justify-between items-center shadow-subtle transition-all"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="text-[9px] bg-primary-tint text-primary border border-primary/20 px-2 py-0.5 rounded-full font-bold">
                          {res.type}
                        </span>
                        <a
                          href={res.fileUrl.startsWith("http") ? res.fileUrl : `https://${res.fileUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block font-bold text-sm text-charcoal hover:text-primary transition-colors mt-1.5 truncate"
                        >
                          {res.fileName}
                        </a>
                        <span className="text-[10px] text-text-muted block mt-1">
                          By {res.uploadedBy?.name || "Member"} • {formatDate(res.createdAt)}
                        </span>
                      </div>

                      <button
                        onClick={() => handleResourceDelete(res._id)}
                        className="p-2 rounded-lg text-text-muted hover:text-danger hover:bg-red-50 transition-all cursor-pointer shrink-0 ml-2"
                        title="Delete Link"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: ACTIVITY TIMELINE */}
          {activeTab === "activity" && (
            <div className="space-y-6">
              <h2 className="text-base font-black text-charcoal pb-3 border-b border-border-slate">
                Workspace Activity Stream
              </h2>
              
              {activities.length === 0 ? (
                <div className="text-center py-16 bg-[#FAF8F4] border border-border-slate rounded-card space-y-2">
                  <span className="text-2xl block">⚡</span>
                  <p className="text-text-muted text-xs">No activity logs recorded yet.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {(() => {
                    const groups = groupActivitiesByDate(activities);
                    
                    const renderActivityGroup = (title, list) => {
                      if (list.length === 0) return null;
                      return (
                        <div className="space-y-3">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-primary">{title}</h3>
                          <div className="relative border-l border-border-slate pl-5 ml-2.5 space-y-4">
                            {list.map((act) => {
                              const actorInitials = act.user?.name ? act.user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "TF";
                              return (
                                <div key={act._id} className="relative">
                                  <div className="absolute -left-[25px] top-3.5 w-2.5 h-2.5 rounded-full bg-primary border-2 border-white" />
                                  
                                  <div className="bg-[#FAF8F4] border border-border-slate rounded-card p-3.5 flex gap-3 items-center shadow-subtle">
                                    <div className="w-7 h-7 rounded-full bg-primary-tint text-primary font-bold text-[10px] flex items-center justify-center shrink-0 border border-primary/20">
                                      {actorInitials}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className="text-xs text-text-secondary leading-snug">
                                        <strong className="text-charcoal font-bold">{act.user?.name || "Member"}</strong>{" "}
                                        <span className="text-primary font-medium">{act.action}</span>{" "}
                                        <strong className="text-charcoal">"{act.target}"</strong>
                                      </p>
                                      <span className="text-[10px] text-text-muted block mt-0.5">{formatDate(act.createdAt)}</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    };

                    return (
                      <>
                        {renderActivityGroup("Today", groups.today)}
                        {renderActivityGroup("Yesterday", groups.yesterday)}
                        {renderActivityGroup("Earlier", groups.earlier)}
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          )}

          {/* TAB 6: AI ASSISTANT */}
          {activeTab === "ai" && (
            <AiAssistant
              projectId={projectId}
              existingTasks={tasks}
              onTaskCreated={(newTask) => {
                if (newTask) {
                  setTasks((prev) => [newTask, ...prev]);
                } else {
                  fetchWorkspaceData();
                }
              }}
            />
          )}

          {/* TAB 7: GITHUB INTEGRATION */}
          {activeTab === "github" && (
            <GitHubTab
              projectId={projectId}
              isCreator={isCreator}
            />
          )}

          {/* TAB 8: DOCUMENTS INTEGRATION */}
          {activeTab === "documents" && (
            <Documents
              projectId={projectId}
              isCreator={isCreator}
              currentUser={currentUser}
            />
          )}

        </div>
      </div>

      {/* ─── MODALS DIALOG POPUPS ───────────────────────────────────────────── */}
      
      {/* 1. TASK CREATE/EDIT FORM MODAL */}
      <AnimatePresence>
        {isTaskModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsTaskModalOpen(false)} className="absolute inset-0 bg-[#242424]/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-md bg-card-surface border border-border-slate p-6 rounded-card z-10 shadow-premium space-y-4">
              <div className="flex justify-between items-center border-b border-border-slate pb-3">
                <h3 className="font-extrabold text-charcoal text-base">{editingTask ? "Edit Sprint Task" : "Create Workspace Task"}</h3>
                <button onClick={() => setIsTaskModalOpen(false)} className="w-7 h-7 rounded-full bg-[#F8F5EF] flex items-center justify-center text-text-muted hover:text-charcoal font-bold cursor-pointer">×</button>
              </div>
              {formError && <p className="text-xs text-danger font-semibold">{formError}</p>}
              <form onSubmit={handleTaskSubmit} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-charcoal">Task Title</label>
                  <input
                    type="text"
                    value={taskFormData.title}
                    onChange={(e) => setTaskFormData({ ...taskFormData, title: e.target.value })}
                    placeholder="Short summary of task..."
                    className="w-full bg-[#F8F5EF] border border-border-slate focus:border-primary focus:bg-white rounded-input py-2 px-3 text-xs text-charcoal outline-none transition-colors"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-charcoal">Description</label>
                  <textarea
                    value={taskFormData.description}
                    onChange={(e) => setTaskFormData({ ...taskFormData, description: e.target.value })}
                    rows={2}
                    placeholder="Task details and acceptance criteria..."
                    className="w-full bg-[#F8F5EF] border border-border-slate focus:border-primary focus:bg-white rounded-input py-2 px-3 text-xs text-charcoal outline-none resize-none transition-colors"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-charcoal">Assigned To</label>
                    <select
                      value={taskFormData.assignedTo}
                      onChange={(e) => setTaskFormData({ ...taskFormData, assignedTo: e.target.value })}
                      className="w-full bg-[#F8F5EF] border border-border-slate focus:border-primary focus:bg-white rounded-input py-2 px-3 text-xs text-charcoal outline-none"
                    >
                      <option value="">Unassigned</option>
                      {teamMembers.map((m) => (
                        <option key={m._id} value={m._id}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-charcoal">Priority</label>
                    <select
                      value={taskFormData.priority}
                      onChange={(e) => setTaskFormData({ ...taskFormData, priority: e.target.value })}
                      className="w-full bg-[#F8F5EF] border border-border-slate focus:border-primary focus:bg-white rounded-input py-2 px-3 text-xs text-charcoal outline-none"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-charcoal">Start Date</label>
                    <input
                      type="date"
                      value={taskFormData.startDate}
                      onChange={(e) => setTaskFormData({ ...taskFormData, startDate: e.target.value })}
                      className="w-full bg-[#F8F5EF] border border-border-slate focus:border-primary focus:bg-white rounded-input py-2 px-3 text-xs text-charcoal outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-charcoal">Due Date</label>
                    <input
                      type="date"
                      value={taskFormData.dueDate}
                      onChange={(e) => setTaskFormData({ ...taskFormData, dueDate: e.target.value })}
                      className="w-full bg-[#F8F5EF] border border-border-slate focus:border-primary focus:bg-white rounded-input py-2 px-3 text-xs text-charcoal outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-charcoal">Sprint Cycle</label>
                  <select
                    value={taskFormData.sprint}
                    onChange={(e) => setTaskFormData({ ...taskFormData, sprint: e.target.value })}
                    className="w-full bg-[#F8F5EF] border border-border-slate focus:border-primary focus:bg-white rounded-input py-2 px-3 text-xs text-charcoal outline-none"
                  >
                    <option value="">No Sprint Assigned</option>
                    {sprints.map((s) => (
                      <option key={s._id} value={s._id}>{s.name} ({s.status})</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-3 border-t border-border-slate">
                  <button type="button" onClick={() => setIsTaskModalOpen(false)} className="flex-1 py-2 rounded-btn text-xs font-bold text-text-secondary bg-[#F8F5EF] hover:bg-white border border-border-slate transition-colors cursor-pointer">Cancel</button>
                  <button type="submit" disabled={formLoading} className="flex-1 py-2 rounded-btn text-xs font-bold text-white bg-primary hover:bg-primary-hover shadow-orange-sm transition-colors cursor-pointer">{formLoading ? "Saving..." : "Save Task"}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. TASK DETAILS & TABBED WORKSPACE WIDGETS MODAL */}
      <AnimatePresence>
        {activeDetailTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setActiveDetailTask(null)} className="absolute inset-0 bg-[#242424]/60 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="relative w-full max-w-2xl bg-card-surface border border-border-slate rounded-card z-10 shadow-premium flex flex-col h-[75vh]"
            >
              {/* Header */}
              <div className="p-6 border-b border-border-slate flex justify-between items-center shrink-0">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-text-muted uppercase tracking-widest font-bold">Task Details</span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase ${
                      activeDetailTask.priority === "High" ? "bg-red-50 text-danger border-red-200" :
                      activeDetailTask.priority === "Medium" ? "bg-amber-50 text-amber-700 border-amber-200" :
                      "bg-sky-50 text-sky-700 border-sky-200"
                    }`}>
                      {activeDetailTask.priority} Priority
                    </span>
                  </div>
                  <h3 className="font-extrabold text-charcoal text-lg mt-1">{activeDetailTask.title}</h3>
                </div>
                <button onClick={() => setActiveDetailTask(null)} className="w-8 h-8 rounded-full bg-[#F8F5EF] flex items-center justify-center text-text-muted hover:text-charcoal font-bold cursor-pointer">×</button>
              </div>

              {/* Tab Selector */}
              <div className="px-6 flex border-b border-border-slate gap-4 text-xs bg-[#FAF8F4] shrink-0">
                {["overview", "comments", "attachments"].map(t => (
                  <button
                    key={t}
                    onClick={() => setDetailTab(t)}
                    className={`py-3 font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
                      detailTab === t ? "border-primary text-primary" : "border-transparent text-text-muted hover:text-charcoal"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* Tab Panels */}
              <div className="flex-1 overflow-y-auto p-6 min-h-0">
                
                {detailTab === "overview" && (
                  <div className="space-y-6 text-sm">
                    <div className="space-y-1.5">
                      <span className="text-xs text-text-muted font-bold uppercase tracking-wider">Description</span>
                      <p className="text-text-secondary leading-relaxed bg-[#FAF8F4] border border-border-slate p-4 rounded-card">
                        {activeDetailTask.description || "No description provided."}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-6 pt-2">
                      <div className="space-y-1">
                        <span className="text-[10px] text-text-muted block uppercase font-bold tracking-wider">Assigned Teammate</span>
                        <span className="font-bold text-charcoal block mt-0.5">{activeDetailTask.assignedTo?.name || "Unassigned"}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-text-muted block uppercase font-bold tracking-wider">Task Status</span>
                        <span className="font-bold text-primary block mt-0.5 capitalize">{activeDetailTask.status}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-text-muted block uppercase font-bold tracking-wider">Start Date</span>
                        <span className="font-bold text-charcoal block mt-0.5">
                          {activeDetailTask.startDate ? new Date(activeDetailTask.startDate).toLocaleDateString() : "Not scheduled"}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-text-muted block uppercase font-bold tracking-wider">Due Deadline</span>
                        <span className="font-bold text-charcoal block mt-0.5">
                          {activeDetailTask.dueDate ? new Date(activeDetailTask.dueDate).toLocaleDateString() : "No deadline"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {detailTab === "comments" && (
                  <TaskComments
                    taskId={activeDetailTask._id}
                    projectId={projectId}
                    currentUser={currentUser}
                  />
                )}

                {detailTab === "attachments" && (
                  <TaskAttachments
                    projectId={projectId}
                    taskId={activeDetailTask._id}
                    isCreator={isCreator}
                    currentUser={currentUser}
                  />
                )}

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. SPRINTS FORM MODAL */}
      <AnimatePresence>
        {isSprintModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsSprintModalOpen(false)} className="absolute inset-0 bg-[#242424]/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-md bg-card-surface border border-border-slate p-6 rounded-card z-10 shadow-premium space-y-4">
              <div className="flex justify-between items-center border-b border-border-slate pb-3">
                <h3 className="font-extrabold text-charcoal text-base">Create Sprint Cycle</h3>
                <button onClick={() => setIsSprintModalOpen(false)} className="w-7 h-7 rounded-full bg-[#F8F5EF] flex items-center justify-center text-text-muted hover:text-charcoal font-bold cursor-pointer">×</button>
              </div>
              {formError && <p className="text-xs text-danger font-semibold">{formError}</p>}
              <form onSubmit={handleSprintSubmit} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-charcoal">Sprint Name</label>
                  <input
                    type="text"
                    value={sprintFormData.name}
                    onChange={(e) => setSprintFormData({ ...sprintFormData, name: e.target.value })}
                    placeholder="e.g. Sprint 1, Alpha Release..."
                    className="w-full bg-[#F8F5EF] border border-border-slate focus:border-primary focus:bg-white rounded-input py-2 px-3 text-xs text-charcoal outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-charcoal">Sprint Goal</label>
                  <textarea
                    value={sprintFormData.goal}
                    onChange={(e) => setSprintFormData({ ...sprintFormData, goal: e.target.value })}
                    rows={2}
                    placeholder="What should this sprint deliver?"
                    className="w-full bg-[#F8F5EF] border border-border-slate focus:border-primary focus:bg-white rounded-input py-2 px-3 text-xs text-charcoal outline-none resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-charcoal">Start Date</label>
                    <input
                      type="date"
                      value={sprintFormData.startDate}
                      onChange={(e) => setSprintFormData({ ...sprintFormData, startDate: e.target.value })}
                      className="w-full bg-[#F8F5EF] border border-border-slate focus:border-primary focus:bg-white rounded-input py-2 px-3 text-xs text-charcoal outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-charcoal">End Date</label>
                    <input
                      type="date"
                      value={sprintFormData.endDate}
                      onChange={(e) => setSprintFormData({ ...sprintFormData, endDate: e.target.value })}
                      className="w-full bg-[#F8F5EF] border border-border-slate focus:border-primary focus:bg-white rounded-input py-2 px-3 text-xs text-charcoal outline-none"
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-3 border-t border-border-slate">
                  <button type="button" onClick={() => setIsSprintModalOpen(false)} className="flex-1 py-2 rounded-btn text-xs font-bold text-text-secondary bg-[#F8F5EF] hover:bg-white border border-border-slate transition-colors cursor-pointer">Cancel</button>
                  <button type="submit" disabled={formLoading} className="flex-1 py-2 rounded-btn text-xs font-bold text-white bg-primary hover:bg-primary-hover shadow-orange-sm transition-colors cursor-pointer">{formLoading ? "Creating..." : "Create Sprint"}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. RESOURCE MODAL */}
      <AnimatePresence>
        {isResourceModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsResourceModalOpen(false)} className="absolute inset-0 bg-[#242424]/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-md bg-card-surface border border-border-slate p-6 rounded-card z-10 shadow-premium space-y-4">
              <div className="flex justify-between items-center border-b border-border-slate pb-3">
                <h3 className="font-extrabold text-charcoal text-base">Add Resource Link</h3>
                <button onClick={() => setIsResourceModalOpen(false)} className="w-7 h-7 rounded-full bg-[#F8F5EF] flex items-center justify-center text-text-muted hover:text-charcoal font-bold cursor-pointer">×</button>
              </div>
              {formError && <p className="text-xs text-danger font-semibold">{formError}</p>}
              <form onSubmit={handleResourceSubmit} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-charcoal">Resource Label</label>
                  <input
                    type="text"
                    value={resourceFormData.fileName}
                    onChange={(e) => setResourceFormData({ ...resourceFormData, fileName: e.target.value })}
                    placeholder="e.g. Design Assets, API docs..."
                    className="w-full bg-[#F8F5EF] border border-border-slate focus:border-primary focus:bg-white rounded-input py-2 px-3 text-xs text-charcoal outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-charcoal">Target URL</label>
                  <input
                    type="text"
                    value={resourceFormData.fileUrl}
                    onChange={(e) => setResourceFormData({ ...resourceFormData, fileUrl: e.target.value })}
                    placeholder="https://figma.com/..., drive.google.com/..."
                    className="w-full bg-[#F8F5EF] border border-border-slate focus:border-primary focus:bg-white rounded-input py-2 px-3 text-xs text-charcoal outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-charcoal">Resource Type</label>
                  <select
                    value={resourceFormData.type}
                    onChange={(e) => setResourceFormData({ ...resourceFormData, type: e.target.value })}
                    className="w-full bg-[#F8F5EF] border border-border-slate focus:border-primary focus:bg-white rounded-input py-2 px-3 text-xs text-charcoal outline-none"
                  >
                    <option value="Link">Web Link</option>
                    <option value="Figma">Figma Board</option>
                    <option value="Drive">Google Drive</option>
                    <option value="Repository">GitHub Repository</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-3 border-t border-border-slate">
                  <button type="button" onClick={() => setIsResourceModalOpen(false)} className="flex-1 py-2 rounded-btn text-xs font-bold text-text-secondary bg-[#F8F5EF] hover:bg-white border border-border-slate transition-colors cursor-pointer">Cancel</button>
                  <button type="submit" disabled={formLoading} className="flex-1 py-2 rounded-btn text-xs font-bold text-white bg-primary hover:bg-primary-hover shadow-orange-sm transition-colors cursor-pointer">{formLoading ? "Adding..." : "Add Resource"}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

// ─── DATE GROUPING HELPER FOR ACTIVITIES ─────────────────────────────────────
const groupActivitiesByDate = (activitiesList) => {
  const today = [];
  const yesterday = [];
  const earlier = [];

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;

  const seenSignatures = new Set();
  const uniqueActivities = [];

  for (const act of activitiesList) {
    if (!act) continue;
    const actTime = new Date(act.createdAt).getTime();
    const signature = `${act.user?._id || "anon"}_${act.action}_${act.target}_${Math.floor(actTime / 60000)}`;
    if (!seenSignatures.has(signature)) {
      seenSignatures.add(signature);
      uniqueActivities.push(act);
    }
  }

  for (const act of uniqueActivities) {
    const actTime = new Date(act.createdAt).getTime();
    if (actTime >= startOfToday) {
      today.push(act);
    } else if (actTime >= startOfYesterday) {
      yesterday.push(act);
    } else {
      earlier.push(act);
    }
  }

  return { today, yesterday, earlier };
};

// ─── TASK CARD COMPONENT ────────────────────────────────────────────────────
const TaskCard = ({ task, onEdit, onDelete, onStatusChange, onDetailClick, attachmentCount }) => {
  const priorityStyles = {
    Low: "bg-sky-50 text-sky-700 border-sky-200",
    Medium: "bg-amber-50 text-amber-700 border-amber-200",
    High: "bg-primary-tint text-primary border-primary/20",
  };

  const initials = task.assignedTo?.name
    ? task.assignedTo.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "";

  return (
    <div className="p-3.5 bg-white border border-border-slate rounded-card flex flex-col gap-2.5 shadow-subtle hover:border-primary/50 transition-all duration-200 group">
      <div className="flex justify-between items-start gap-2">
        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase ${priorityStyles[task.priority] || priorityStyles.Medium}`}>
          {task.priority || "Medium"}
        </span>
        
        {/* Card Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onEdit(task)} className="p-1 rounded text-text-muted hover:text-charcoal hover:bg-[#F8F5EF] transition-colors cursor-pointer" title="Edit Task">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
          <button onClick={() => onDelete(task._id)} className="p-1 rounded text-text-muted hover:text-danger hover:bg-red-50 transition-colors cursor-pointer" title="Delete Task">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      <div className="space-y-1 cursor-pointer" onClick={onDetailClick}>
        <h4 className="font-bold text-xs text-charcoal leading-snug break-words group-hover:text-primary transition-colors">{task.title}</h4>
        {task.description && (
          <p className="text-[11px] text-text-muted line-clamp-2 leading-relaxed break-words">{task.description}</p>
        )}
      </div>

      <div className="flex justify-between items-center border-t border-border-slate pt-2.5 mt-0.5 gap-2">
        {/* Status Dropdown */}
        <select
          value={task.status}
          onChange={(e) => onStatusChange(task._id, e.target.value)}
          className="bg-transparent text-[10px] text-primary font-bold outline-none cursor-pointer border-none"
        >
          <option value="Todo">Todo</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
        </select>

        <div className="flex items-center gap-2">
          {attachmentCount > 0 && (
            <span className="text-[10px] text-primary font-bold bg-primary-tint border border-primary/20 px-1.5 py-0.5 rounded flex items-center gap-1 select-none" title={`${attachmentCount} files attached`}>
              📎 {attachmentCount}
            </span>
          )}

          {/* Assignee Avatar */}
          {initials ? (
            <div
              className="w-5 h-5 rounded-full bg-primary-tint border border-primary/20 flex items-center justify-center font-bold text-[8px] text-primary"
              title={`Assigned to ${task.assignedTo?.name || "Teammate"}`}
            >
              {initials}
            </div>
          ) : (
            <span className="text-[9px] text-text-muted italic">Unassigned</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default Workspace;
