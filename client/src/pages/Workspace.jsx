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
  const [filterType, setFilterType] = useState("all"); // all, me, high, today, overdue, completed, in_progress

  // Modals / Form toggles
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null); // Task object if editing
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

    // Setup an interval to update durations/relative times dynamically
    const interval = setInterval(() => {
      setTimeTicker(Date.now());
    }, 15000);

    return () => clearInterval(interval);
  }, [projectId, isAuthenticated]);

  // ─── 2. SOCKET.IO ROOM REGISTRATION & SYNC ──────────────────────────────
  useEffect(() => {
    if (!socket || !project) return;

    // Join room
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

    const handleSprintUpdated = (sprintEvent) => {
      // Re-fetch sprints to recalculate stats
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

    // Fetch team roster
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
    if (diff === 1) return "Active for 1 min";
    return `Active for ${diff} mins`;
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

  // Filter Tasks list based on query and filter parameters
  const getFilteredTasks = () => {
    return tasks.filter((t) => {
      // Search text query match
      if (
        searchQuery &&
        !t.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !t.description?.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }
      
      // Category filter match
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

  // Column arrays populated from filtered tasks
  const filteredTaskList = getFilteredTasks();
  const todoTasks = filteredTaskList.filter((t) => t.status === "Todo");
  const inProgressTasks = filteredTaskList.filter((t) => t.status === "In Progress");
  const completedTasks = filteredTaskList.filter((t) => t.status === "Completed");

  // Statistics
  const totalTasks = tasks.length;
  const compTasks = tasks.filter((t) => t.status === "Completed").length;
  const pendingTasks = totalTasks - compTasks;
  const progressPercentage = totalTasks > 0 ? Math.round((compTasks / totalTasks) * 100) : 0;

  // Productivity Analytics Calculations
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
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <span className="text-gray-400 text-xs mt-3 tracking-wider animate-pulse">Entering project workspace...</span>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center px-6">
        <div className="text-center max-w-md bg-bg-secondary p-8 rounded-card border border-border-slate shadow-premium">
          <h2 className="text-2xl font-black text-white mb-4">Workspace Access Denied</h2>
          <p className="text-gray-400 mb-8 leading-relaxed">{error || "Access Denied."}</p>
          <Link to="/dashboard" className="inline-flex items-center gap-2 px-6 py-3 rounded-btn font-semibold text-white bg-primary hover:bg-primary-hover shadow-subtle transition-all duration-200">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-base text-white pt-24 pb-6 px-4 md:px-6 relative overflow-hidden flex flex-col md:flex-row gap-6">
      
      {/* LEFT SIDEBAR: TEAM SUMMARY PANEL */}
      <div className="w-full md:w-80 bg-bg-secondary border border-border-slate rounded-card p-6 flex flex-col shrink-0 gap-6 z-10 self-start shadow-subtle">
        
        {/* Project Title Header */}
        <div className="border-b border-border-slate pb-4">
          <span className="text-[10px] font-bold text-primary-light uppercase tracking-widest bg-primary/10 px-2.5 py-1 rounded border border-primary/20">
            {project.category}
          </span>
          <h1 className="text-xl font-black mt-3 tracking-tight text-white leading-tight truncate">
            {project.title}
          </h1>
          <p className="text-xs text-gray-400 mt-1">Workspace Board</p>
        </div>

        {/* Progress Gauge */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-gray-400 font-medium">Task Progress</span>
            <span className="text-white font-bold">{progressPercentage}% ({compTasks}/{totalTasks})</span>
          </div>
          <div className="w-full bg-bg-base h-2 rounded-full overflow-hidden border border-border-slate">
            <div
              className="gradient-bg h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Quick Statistics */}
        <div className="grid grid-cols-2 gap-3 text-center border-t border-b border-border-slate py-4">
          <div className="bg-card-surface p-2.5 rounded-card border border-border-slate">
            <span className="text-xs text-gray-400 block">Pending</span>
            <span className="text-sm font-bold text-warning">{pendingTasks}</span>
          </div>
          <div className="bg-card-surface p-2.5 rounded-card border border-border-slate">
            <span className="text-xs text-gray-400 block">Links Shared</span>
            <span className="text-sm font-bold text-primary-light">{resources.length}</span>
          </div>
        </div>

        {/* Team Members List / Live User Presence */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
            Online Members ({
              teamMembers.filter(m => 
                onlineMembers.some(o => o.userId === m._id.toString() && o.connectedAt)
              ).length
            })
          </h3>
          <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
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
                  <div key={member._id} className="flex items-center gap-3 p-1 rounded-card">
                    <div className="relative shrink-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-[10px] text-white ${
                        isLead ? "gradient-bg" : "bg-primary/10 border border-primary/20 text-primary-light"
                      }`}>
                        {initials}
                      </div>
                      {/* Presence indicator dot */}
                      <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-bg-secondary ${
                        isOnline ? "bg-success animate-pulse" : "bg-gray-600"
                      }`} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                        {member.name}
                        {isLead && (
                          <span className="text-[9px] bg-primary/10 text-primary-light border border-primary/20 px-1 rounded font-semibold">
                            Lead
                          </span>
                        )}
                      </h4>
                      {isOnline ? (
                        <p className="text-[9px] text-success font-medium truncate">
                          {getDurationText(presence.connectedAt)}
                        </p>
                      ) : (
                        <p className="text-[9px] text-gray-400 truncate">
                          {presence?.lastSeen ? getLastSeenText(presence.lastSeen) : "Offline"}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* RIGHT MAIN PANEL: TABS AREA */}
      <div className="flex-1 bg-bg-secondary border border-border-slate rounded-card p-6 flex flex-col z-10 min-w-0 h-[85vh] shadow-subtle">
        
        <div className="flex border-b border-border-slate gap-6 mb-6 text-sm shrink-0 overflow-x-auto scrollbar-none">
          {["tasks", "sprints", "productivity", "resources", "activity", "ai", "github", "documents"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 font-semibold capitalize relative cursor-pointer whitespace-nowrap transition-colors ${
                activeTab === tab ? "text-primary-light" : "text-gray-400 hover:text-white"
              }`}
            >
              {tab === "ai" ? "AI Assistant" : tab === "github" ? "GitHub" : tab === "documents" ? "Documents" : `${tab} board`}
              {activeTab === tab && (
                <motion.div layoutId="activeWorkspaceTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
          ))}
        </div>

        {/* Dynamic Area */}
        <div className="flex-1 overflow-y-auto min-h-0">
          
          {/* TAB 1: TASKS BOARD */}
          {activeTab === "tasks" && (
            <div className="h-full flex flex-col space-y-4">
              
              {/* Search, Filter & Actions Row */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0 bg-bg-base/30 border border-border-slate/50 p-4 rounded-card">
                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search tasks..."
                    className="bg-card-surface border border-border-slate focus:border-primary rounded-input px-3 py-1.5 text-xs text-white outline-none w-full sm:w-48 placeholder:text-gray-500"
                  />
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="bg-card-surface border border-border-slate focus:border-primary rounded-input px-3 py-1.5 text-xs text-white outline-none cursor-pointer"
                  >
                    <option value="all">All Tasks</option>
                    <option value="me">Assigned To Me</option>
                    <option value="high">High Priority</option>
                    <option value="today">Due Today</option>
                    <option value="overdue">Overdue</option>
                    <option value="completed">Completed</option>
                    <option value="in_progress">In Progress</option>
                  </select>
                </div>
                
                <button
                  onClick={handleOpenTaskCreate}
                  className="px-4 py-2 rounded-btn bg-primary hover:bg-primary-hover text-xs font-bold text-white transition-colors cursor-pointer"
                >
                  Create Task
                </button>
              </div>

              {/* Status Columns Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-grow overflow-y-auto pt-2">
                
                {/* Column 1: TODO */}
                <div className="bg-bg-base border border-border-slate rounded-card p-4 flex flex-col gap-3 min-h-[300px]">
                  <div className="flex justify-between items-center border-b border-border-slate pb-2">
                    <span className="text-xs font-bold text-gray-400 block uppercase">Todo</span>
                    <span className="text-[10px] bg-white/10 text-gray-300 px-2 rounded-md font-bold">{todoTasks.length}</span>
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
                <div className="bg-bg-base border border-border-slate rounded-card p-4 flex flex-col gap-3 min-h-[300px]">
                  <div className="flex justify-between items-center border-b border-border-slate pb-2">
                    <span className="text-xs font-bold text-gray-400 block uppercase">In Progress</span>
                    <span className="text-[10px] bg-warning/10 text-warning px-2 rounded-md font-bold">{inProgressTasks.length}</span>
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
                <div className="bg-bg-base border border-border-slate rounded-card p-4 flex flex-col gap-3 min-h-[300px]">
                  <div className="flex justify-between items-center border-b border-border-slate pb-2">
                    <span className="text-xs font-bold text-gray-400 block uppercase">Completed</span>
                    <span className="text-[10px] bg-success/10 text-success px-2 rounded-md font-bold">{completedTasks.length}</span>
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
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold tracking-tight text-white">Sprint Cycles</h2>
                <button
                  onClick={() => setIsSprintModalOpen(true)}
                  className="px-4 py-2 rounded-btn bg-primary hover:bg-primary-hover text-xs font-bold text-white transition-colors cursor-pointer"
                >
                  Create Sprint
                </button>
              </div>

              {sprints.length === 0 ? (
                <div className="text-center py-16 bg-bg-base border border-border-slate rounded-card">
                  <p className="text-gray-500 text-sm">No sprints created yet. Create a sprint to organize tasks into cycles.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {sprints.map((sprint) => {
                    const isSprintActive = sprint.status === "active";
                    return (
                      <div key={sprint._id} className="bg-bg-secondary border border-border-slate rounded-card p-5 space-y-4">
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <div className="flex items-center gap-3">
                              <h3 className="font-bold text-white text-base">{sprint.name}</h3>
                              <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold border tracking-wider ${
                                sprint.status === "active" ? "bg-success/15 border-success/30 text-success" :
                                sprint.status === "completed" ? "bg-gray-500/10 border-gray-500/30 text-gray-400" :
                                "bg-primary/10 border-primary/20 text-primary-light"
                              }`}>
                                {sprint.status}
                              </span>
                            </div>
                            <p className="text-gray-400 text-xs mt-1">{sprint.goal || "No goal specified"}</p>
                            <span className="text-[10px] text-gray-500 block mt-2">
                              🗓️ {new Date(sprint.startDate).toLocaleDateString()} - {new Date(sprint.endDate).toLocaleDateString()}
                            </span>
                          </div>

                          <div className="flex gap-2">
                            {sprint.status === "planned" && (
                              <button
                                onClick={async () => {
                                  await sprintService.updateSprint(sprint._id, { status: "active" });
                                  fetchWorkspaceData();
                                }}
                                className="px-3 py-1.5 bg-success hover:bg-success/90 text-white rounded text-xs font-semibold cursor-pointer"
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
                                className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white rounded text-xs font-semibold cursor-pointer"
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
                              className="px-3 py-1.5 border border-border-slate text-danger hover:bg-danger/5 rounded text-xs font-semibold cursor-pointer"
                            >
                              Delete
                            </button>
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div className="space-y-1.5 pt-2 border-t border-border-slate/30">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-gray-500">Progress Completion</span>
                            <span className="text-white font-bold">{sprint.stats?.completionRate || 0}% ({sprint.stats?.completedTasks || 0}/{sprint.stats?.totalTasks || 0} Tasks)</span>
                          </div>
                          <div className="w-full bg-bg-base h-1.5 rounded-full overflow-hidden">
                            <div className="bg-primary h-full rounded-full" style={{ width: `${sprint.stats?.completionRate || 0}%` }} />
                          </div>
                        </div>

                        {/* Tasks in Sprint list */}
                        <div className="space-y-2 pt-2">
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Sprint Backlog</span>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {tasks.filter(t => t.sprint === sprint._id).map(t => (
                              <div key={t._id} className="p-3 bg-bg-base/40 border border-border-slate/60 rounded flex justify-between items-center text-xs">
                                <span className="truncate text-white max-w-[200px]">{t.title}</span>
                                <span className={`px-2 py-0.5 rounded text-[8px] uppercase font-bold border ${
                                  t.status === "Completed" ? "bg-success/10 border-success/30 text-success" : "bg-warning/10 border-warning/30 text-warning"
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
              <h2 className="text-lg font-bold tracking-tight text-white">Workspace Analytics</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-bg-secondary border border-border-slate p-6 rounded-card">
                  <span className="text-[10px] text-gray-500 block uppercase font-bold tracking-wider">Tasks Completed</span>
                  <span className="text-3xl font-extrabold text-success block mt-1">{compTasks}</span>
                  <span className="text-[10px] text-gray-400 mt-2 block">Of total {totalTasks} task cards</span>
                </div>
                
                <div className="bg-bg-secondary border border-border-slate p-6 rounded-card">
                  <span className="text-[10px] text-gray-500 block uppercase font-bold tracking-wider">Tasks Remaining</span>
                  <span className="text-3xl font-extrabold text-warning block mt-1">{pendingTasks}</span>
                  <span className="text-[10px] text-gray-400 mt-2 block">Active backlog items</span>
                </div>

                <div className="bg-bg-secondary border border-border-slate p-6 rounded-card">
                  <span className="text-[10px] text-gray-500 block uppercase font-bold tracking-wider">Completion Rate</span>
                  <span className="text-3xl font-extrabold text-primary-light block mt-1">{progressPercentage}%</span>
                  <span className="text-[10px] text-gray-400 mt-2 block">Sprint delivery percentage</span>
                </div>

                <div className="bg-bg-secondary border border-border-slate p-6 rounded-card">
                  <span className="text-[10px] text-gray-500 block uppercase font-bold tracking-wider">Avg Completion Time</span>
                  <span className="text-3xl font-extrabold text-white block mt-1">{averageCompletionTime}</span>
                  <span className="text-[10px] text-gray-400 mt-2 block">Hours from task created to completed</span>
                </div>

                <div className="bg-bg-secondary border border-border-slate p-6 rounded-card">
                  <span className="text-[10px] text-gray-500 block uppercase font-bold tracking-wider">Active Sprint Progress</span>
                  {activeSprint ? (
                    <>
                      <span className="text-lg font-bold text-white block mt-2">{activeSprint.name}</span>
                      <span className="text-[10px] text-gray-400 block mt-1">Goal: {activeSprint.goal || "None"}</span>
                    </>
                  ) : (
                    <span className="text-xs italic text-gray-500 block mt-3">No active sprint cycle</span>
                  )}
                </div>

                <div className="bg-bg-secondary border border-border-slate p-6 rounded-card">
                  <span className="text-[10px] text-gray-500 block uppercase font-bold tracking-wider">Collaborators Present</span>
                  <span className="text-3xl font-extrabold text-white block mt-1">
                    {onlineMembers.filter(o => o.connectedAt).length}
                  </span>
                  <span className="text-[10px] text-success mt-2 block">Teammates online in room</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: RESOURCES BOARD */}
          {activeTab === "resources" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold tracking-tight text-white">Project Resources</h2>
                <button
                  onClick={() => setIsResourceModalOpen(true)}
                  className="px-4 py-2 rounded-btn bg-primary hover:bg-primary-hover text-xs font-bold text-white transition-colors cursor-pointer"
                >
                  Add Resource Link
                </button>
              </div>

              {resources.length === 0 ? (
                <div className="text-center py-16 bg-bg-base border border-border-slate rounded-card">
                  <p className="text-gray-500 text-sm">No resources linked for this project.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {resources.map((res) => {
                    return (
                      <div
                        key={res._id}
                        className="bg-card-surface border border-border-slate hover:border-primary rounded-card p-5 flex justify-between items-center shadow-subtle transition-all duration-200"
                      >
                        <div className="min-w-0">
                          <span className="text-[9px] bg-primary/10 text-primary-light border border-primary/20 px-2 py-0.5 rounded-md font-bold">
                            {res.type}
                          </span>
                          <a
                            href={res.fileUrl.startsWith("http") ? res.fileUrl : `https://${res.fileUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block font-bold text-sm text-white hover:text-primary-light transition-colors mt-2 truncate"
                          >
                            {res.fileName}
                          </a>
                          <span className="text-[10px] text-gray-400 block mt-1">
                            Shared by: {res.uploadedBy?.name || "Member"} • {formatDate(res.createdAt)}
                          </span>
                        </div>

                        <button
                          onClick={() => handleResourceDelete(res._id)}
                          className="p-2 rounded-lg text-gray-400 hover:text-danger hover:bg-danger/5 transition-all cursor-pointer shrink-0"
                          title="Delete Link"
                        >
                          <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: ACTIVITY TIMELINE */}
          {activeTab === "activity" && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold tracking-tight text-white">Activity Logs</h2>
              
              {activities.length === 0 ? (
                <div className="text-center py-16 bg-bg-base border border-border-slate rounded-card">
                  <p className="text-gray-500 text-sm">No activity logs recorded yet.</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {(() => {
                    const groups = groupActivitiesByDate(activities);
                    
                    const renderActivityGroup = (title, list) => {
                      if (list.length === 0) return null;
                      return (
                        <div className="space-y-4">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-primary-light">{title}</h3>
                          <div className="relative border-l border-border-slate pl-6 ml-3 space-y-6">
                            {list.map((act) => {
                              const actorInitials = act.user?.name ? act.user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "TF";
                              return (
                                <div key={act._id} className="relative">
                                  {/* Bullet checkmark anchor indicator */}
                                  <div className="absolute -left-[31px] w-2.5 h-2.5 rounded-full bg-primary border border-bg-base" />
                                  
                                  <div className="bg-card-surface border border-border-slate rounded-card p-4 flex gap-3 items-center hover:border-primary transition-all duration-200">
                                    <span className="text-success font-extrabold shrink-0 select-none text-sm">✓</span>
                                    <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary-light font-bold text-[9px] flex items-center justify-center shrink-0">
                                      {actorInitials}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-xs text-gray-300 leading-relaxed">
                                        <span className="font-bold text-white">{act.user?.name || "Someone"}</span>{" "}
                                        <span className="text-primary-light font-medium">{act.action}</span>{" "}
                                        <span className="font-bold text-white">"{act.target}"</span>
                                      </p>
                                      <span className="text-[9px] text-gray-400 block mt-0.5">{formatDate(act.createdAt)}</span>
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsTaskModalOpen(false)} className="absolute inset-0 bg-bg-base/85 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-md bg-bg-secondary border border-border-slate p-6 rounded-modal z-10 shadow-premium space-y-4">
              <div className="flex justify-between items-center border-b border-border-slate pb-3">
                <h3 className="font-bold text-white text-base">{editingTask ? "Edit Sprint Task" : "Create Workspace Task"}</h3>
                <button onClick={() => setIsTaskModalOpen(false)} className="text-gray-400 hover:text-white text-lg">×</button>
              </div>
              {formError && <p className="text-xs text-danger">{formError}</p>}
              <form onSubmit={handleTaskSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400">Task Title</label>
                  <input
                    type="text"
                    value={taskFormData.title}
                    onChange={(e) => setTaskFormData({ ...taskFormData, title: e.target.value })}
                    placeholder="Short summary..."
                    className="w-full bg-card-surface border border-border-slate focus:border-primary rounded-input py-2 px-3 text-xs text-white outline-none"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400">Description</label>
                  <textarea
                    value={taskFormData.description}
                    onChange={(e) => setTaskFormData({ ...taskFormData, description: e.target.value })}
                    rows={2}
                    placeholder="Task details..."
                    className="w-full bg-card-surface border border-border-slate focus:border-primary rounded-input py-2 px-3 text-xs text-white outline-none resize-none"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400">Assigned To</label>
                    <select
                      value={taskFormData.assignedTo}
                      onChange={(e) => setTaskFormData({ ...taskFormData, assignedTo: e.target.value })}
                      className="w-full bg-card-surface border border-border-slate focus:border-primary rounded-input py-2 px-3 text-xs text-white outline-none"
                    >
                      <option value="">Unassigned</option>
                      {teamMembers.map((m) => (
                        <option key={m._id} value={m._id}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400">Priority</label>
                    <select
                      value={taskFormData.priority}
                      onChange={(e) => setTaskFormData({ ...taskFormData, priority: e.target.value })}
                      className="w-full bg-card-surface border border-border-slate focus:border-primary rounded-input py-2 px-3 text-xs text-white outline-none"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400">Start Date</label>
                    <input
                      type="date"
                      value={taskFormData.startDate}
                      onChange={(e) => setTaskFormData({ ...taskFormData, startDate: e.target.value })}
                      className="w-full bg-card-surface border border-border-slate focus:border-primary rounded-input py-2 px-3 text-xs text-white outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400">Due Date</label>
                    <input
                      type="date"
                      value={taskFormData.dueDate}
                      onChange={(e) => setTaskFormData({ ...taskFormData, dueDate: e.target.value })}
                      className="w-full bg-card-surface border border-border-slate focus:border-primary rounded-input py-2 px-3 text-xs text-white outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400">Sprint Cycle</label>
                  <select
                    value={taskFormData.sprint}
                    onChange={(e) => setTaskFormData({ ...taskFormData, sprint: e.target.value })}
                    className="w-full bg-card-surface border border-border-slate focus:border-primary rounded-input py-2 px-3 text-xs text-white outline-none"
                  >
                    <option value="">No Sprint Assigned</option>
                    {sprints.map((s) => (
                      <option key={s._id} value={s._id}>{s.name} ({s.status})</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setIsTaskModalOpen(false)} className="flex-1 py-2.5 rounded-btn text-xs text-gray-300 border border-border-slate hover:bg-hover-surface transition-colors cursor-pointer">Cancel</button>
                  <button type="submit" disabled={formLoading} className="flex-1 py-2.5 rounded-btn text-xs font-semibold text-white bg-primary hover:bg-primary-hover transition-colors cursor-pointer">{formLoading ? "Saving..." : "Save Task"}</button>
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setActiveDetailTask(null)} className="absolute inset-0 bg-bg-base/85 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="relative w-full max-w-2xl bg-bg-secondary border border-border-slate rounded-modal z-10 shadow-premium flex flex-col h-[75vh]"
            >
              {/* Header */}
              <div className="p-6 border-b border-border-slate/60 flex justify-between items-center shrink-0">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Task Details</span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase ${
                      activeDetailTask.priority === "High" ? "bg-danger/10 text-danger border-danger/20" :
                      activeDetailTask.priority === "Medium" ? "bg-warning/10 text-warning border-warning/20" :
                      "bg-primary/10 text-primary-light border-primary/20"
                    }`}>
                      {activeDetailTask.priority}
                    </span>
                  </div>
                  <h3 className="font-extrabold text-white text-lg mt-1">{activeDetailTask.title}</h3>
                </div>
                <button onClick={() => setActiveDetailTask(null)} className="text-gray-400 hover:text-white text-lg">×</button>
              </div>

              {/* Tab Selector */}
              <div className="px-6 flex border-b border-border-slate/40 gap-4 text-xs bg-bg-base/15 shrink-0">
                {["overview", "comments", "attachments"].map(t => (
                  <button
                    key={t}
                    onClick={() => setDetailTab(t)}
                    className={`py-3 font-semibold uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
                      detailTab === t ? "border-primary text-primary-light" : "border-transparent text-gray-400"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* Tab Panels */}
              <div className="flex-1 overflow-y-auto p-6 min-h-0">
                
                {/* Detail Tab 1: Overview Details */}
                {detailTab === "overview" && (
                  <div className="space-y-6 text-sm">
                    <div className="space-y-1.5">
                      <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Description</span>
                      <p className="text-gray-300 leading-relaxed bg-bg-base/30 border border-border-slate/40 p-4 rounded-card">
                        {activeDetailTask.description || "No description provided."}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-6 pt-2">
                      <div className="space-y-1">
                        <span className="text-[10px] text-gray-500 block uppercase font-bold tracking-wider">Assigned Teammate</span>
                        <span className="font-bold text-white block mt-0.5">{activeDetailTask.assignedTo?.name || "Unassigned"}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-gray-500 block uppercase font-bold tracking-wider">Task Status</span>
                        <span className="font-bold text-primary-light block mt-0.5 capitalize">{activeDetailTask.status}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-gray-500 block uppercase font-bold tracking-wider">Start Date</span>
                        <span className="font-bold text-white block mt-0.5">
                          {activeDetailTask.startDate ? new Date(activeDetailTask.startDate).toLocaleDateString() : "Not scheduled"}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-gray-500 block uppercase font-bold tracking-wider">Due Deadline</span>
                        <span className="font-bold text-white block mt-0.5">
                          {activeDetailTask.dueDate ? new Date(activeDetailTask.dueDate).toLocaleDateString() : "No deadline"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Detail Tab 2: Real-time Comments list */}
                {detailTab === "comments" && (
                  <TaskComments
                    taskId={activeDetailTask._id}
                    projectId={projectId}
                    currentUser={currentUser}
                  />
                )}

                {/* Detail Tab 3: Attachment uploads */}
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsSprintModalOpen(false)} className="absolute inset-0 bg-bg-base/85 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-md bg-bg-secondary border border-border-slate p-6 rounded-modal z-10 shadow-premium space-y-4">
              <div className="flex justify-between items-center border-b border-border-slate pb-3">
                <h3 className="font-bold text-white text-base">Create Sprint Cycle</h3>
                <button onClick={() => setIsSprintModalOpen(false)} className="text-gray-400 hover:text-white text-lg">×</button>
              </div>
              {formError && <p className="text-xs text-danger">{formError}</p>}
              <form onSubmit={handleSprintSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400">Sprint Name</label>
                  <input
                    type="text"
                    value={sprintFormData.name}
                    onChange={(e) => setSprintFormData({ ...sprintFormData, name: e.target.value })}
                    placeholder="e.g. Sprint 1, Alpha Cycle..."
                    className="w-full bg-card-surface border border-border-slate focus:border-primary rounded-input py-2 px-3 text-xs text-white outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400">Goal Description</label>
                  <textarea
                    value={sprintFormData.goal}
                    onChange={(e) => setSprintFormData({ ...sprintFormData, goal: e.target.value })}
                    rows={2}
                    placeholder="What does this sprint deliver?"
                    className="w-full bg-card-surface border border-border-slate focus:border-primary rounded-input py-2 px-3 text-xs text-white outline-none resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400">Start Date</label>
                    <input
                      type="date"
                      value={sprintFormData.startDate}
                      onChange={(e) => setSprintFormData({ ...sprintFormData, startDate: e.target.value })}
                      className="w-full bg-card-surface border border-border-slate focus:border-primary rounded-input py-2 px-3 text-xs text-white outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400">End Date</label>
                    <input
                      type="date"
                      value={sprintFormData.endDate}
                      onChange={(e) => setSprintFormData({ ...sprintFormData, endDate: e.target.value })}
                      className="w-full bg-card-surface border border-border-slate focus:border-primary rounded-input py-2 px-3 text-xs text-white outline-none"
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setIsSprintModalOpen(false)} className="flex-1 py-2.5 rounded-btn text-xs text-gray-300 border border-border-slate hover:bg-hover-surface transition-colors cursor-pointer">Cancel</button>
                  <button type="submit" disabled={formLoading} className="flex-1 py-2.5 rounded-btn text-xs font-semibold text-white bg-primary hover:bg-primary-hover transition-colors cursor-pointer">{formLoading ? "Creating..." : "Create Sprint"}</button>
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsResourceModalOpen(false)} className="absolute inset-0 bg-bg-base/85 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-md bg-bg-secondary border border-border-slate p-6 rounded-modal z-10 shadow-premium space-y-4">
              <div className="flex justify-between items-center border-b border-border-slate pb-3">
                <h3 className="font-bold text-white text-base">Add Resource Link</h3>
                <button onClick={() => setIsResourceModalOpen(false)} className="text-gray-400 hover:text-white text-lg">×</button>
              </div>
              {formError && <p className="text-xs text-danger">{formError}</p>}
              <form onSubmit={handleResourceSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400">Resource Name</label>
                  <input
                    type="text"
                    value={resourceFormData.fileName}
                    onChange={(e) => setResourceFormData({ ...resourceFormData, fileName: e.target.value })}
                    placeholder="e.g. Design Assets, API docs..."
                    className="w-full bg-card-surface border border-border-slate focus:border-primary rounded-input py-2 px-3 text-xs text-white outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400">Resource Link URL</label>
                  <input
                    type="text"
                    value={resourceFormData.fileUrl}
                    onChange={(e) => setResourceFormData({ ...resourceFormData, fileUrl: e.target.value })}
                    placeholder="e.g. figma.com/..., drive.google.com/..."
                    className="w-full bg-card-surface border border-border-slate focus:border-primary rounded-input py-2 px-3 text-xs text-white outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400">Type</label>
                  <select
                    value={resourceFormData.type}
                    onChange={(e) => setResourceFormData({ ...resourceFormData, type: e.target.value })}
                    className="w-full bg-card-surface border border-border-slate focus:border-primary rounded-input py-2 px-3 text-xs text-white outline-none"
                  >
                    <option value="Link">Web Link</option>
                    <option value="Figma">Figma Board</option>
                    <option value="Drive">Google Drive</option>
                    <option value="Repository">GitHub Repository</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setIsResourceModalOpen(false)} className="flex-1 py-2.5 rounded-btn text-xs text-gray-300 border border-border-slate hover:bg-hover-surface transition-colors cursor-pointer">Cancel</button>
                  <button type="submit" disabled={formLoading} className="flex-1 py-2.5 rounded-btn text-xs font-semibold text-white bg-primary hover:bg-primary-hover transition-colors cursor-pointer">{formLoading ? "Uploading..." : "Add Resource"}</button>
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

  // Deduplicate activities by matching signature within 1 minute
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
  const priorityColors = {
    Low: "bg-primary/10 text-primary-light border-primary/20",
    Medium: "bg-warning/10 text-warning border-warning/20",
    High: "bg-danger/10 text-danger border-danger/20",
  };

  const initials = task.assignedTo?.name
    ? task.assignedTo.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "";

  return (
    <div className="p-4 bg-card-surface border border-border-slate rounded-card flex flex-col gap-3 shadow-subtle hover:border-primary transition-all duration-200 group">
      <div className="flex justify-between items-start gap-3">
        <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase ${priorityColors[task.priority]}`}>
          {task.priority}
        </span>
        
        {/* Card Actions */}
        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onEdit(task)} className="p-1 rounded text-gray-400 hover:text-white transition-colors cursor-pointer" title="Edit Task">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
          <button onClick={() => onDelete(task._id)} className="p-1 rounded text-gray-400 hover:text-danger transition-colors cursor-pointer" title="Delete Task">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      <div className="space-y-1 cursor-pointer" onClick={onDetailClick}>
        <h4 className="font-bold text-xs text-white leading-snug break-words group-hover:text-primary-light transition-colors">{task.title}</h4>
        {task.description && (
          <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed break-words">{task.description}</p>
        )}
      </div>

      <div className="flex justify-between items-center border-t border-border-slate/50 pt-3 mt-1 gap-2">
        {/* Status Dropdown */}
        <select
          value={task.status}
          onChange={(e) => onStatusChange(task._id, e.target.value)}
          className="bg-transparent text-[10px] text-primary-light font-bold outline-none cursor-pointer border-none"
        >
          <option value="Todo">Todo</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
        </select>

        <div className="flex items-center gap-2">
          {attachmentCount > 0 && (
            <span className="text-[10px] text-primary-light font-bold bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded flex items-center gap-1 select-none" title={`${attachmentCount} files attached`}>
              📎 {attachmentCount}
            </span>
          )}

          {/* Assignee Avatar */}
          {initials ? (
            <div
              className="w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-[9px] text-primary-light"
              title={`Assigned to ${task.assignedTo.name}`}
            >
              {initials}
            </div>
          ) : (
            <span className="text-[9px] text-gray-500 italic">Unassigned</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default Workspace;
