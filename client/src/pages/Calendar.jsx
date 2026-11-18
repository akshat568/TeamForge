import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import sprintService from "../services/sprintService";

const Calendar = () => {
  const { user: currentUser } = useAuth();

  const [viewMode, setViewMode] = useState("month"); // month, week, day
  const [currentDate, setCurrentDate] = useState(new Date());

  const [workspaces, setWorkspaces] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);

  // 1. Fetch all user workspaces, tasks, and sprints
  useEffect(() => {
    const loadAllCalendarEvents = async () => {
      try {
        setLoading(true);
        setError("");

        // Fetch workspaces
        const wsRes = await api.get("/projects/user-workspaces");
        if (!wsRes.data.success) throw new Error("Failed to load workspaces.");

        const wsList = wsRes.data.workspaces;
        setWorkspaces(wsList);

        const allEvents = [];

        // For each workspace, fetch tasks and sprints in parallel
        await Promise.all(
          wsList.map(async (ws) => {
            try {
              // Get tasks
              const tasksRes = await api.get(`/tasks/project/${ws._id}`);
              if (tasksRes.data.success) {
                tasksRes.data.tasks.forEach((task) => {
                  if (task.dueDate) {
                    const isCompleted = task.status === "Completed";
                    const isOverdue = !isCompleted && new Date(task.dueDate) < new Date();

                    let color = "blue";
                    if (isCompleted) color = "green";
                    else if (isOverdue) color = "red";
                    else if (task.priority === "High") color = "orange";

                    allEvents.push({
                      id: task._id,
                      type: "task",
                      title: task.title,
                      description: task.description || "No description",
                      start: new Date(task.startDate || task.dueDate),
                      end: new Date(task.dueDate),
                      color,
                      workspaceName: ws.title,
                      workspaceId: ws._id,
                      status: task.status,
                      priority: task.priority,
                      assignedTo: task.assignedTo,
                    });
                  }
                });
              }

              // Get sprints
              const sprintsRes = await sprintService.getProjectSprints(ws._id);
              if (sprintsRes.data.success) {
                sprintsRes.data.sprints.forEach((sprint) => {
                  allEvents.push({
                    id: sprint._id,
                    type: "sprint",
                    title: `Sprint: ${sprint.name}`,
                    description: sprint.goal || "No sprint goal",
                    start: new Date(sprint.startDate),
                    end: new Date(sprint.endDate),
                    color: "purple",
                    workspaceName: ws.title,
                    workspaceId: ws._id,
                    status: sprint.status,
                  });
                });
              }
            } catch (err) {
              console.error(`Error loading events for workspace ${ws.title}:`, err);
            }
          })
        );

        setEvents(allEvents);
      } catch (err) {
        setError(err.message || "Failed to load calendar events.");
      } finally {
        setLoading(false);
      }
    };

    loadAllCalendarEvents();
  }, [currentUser]);

  // 2. Calendar Helper functions
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const startDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    return { startDay, totalDays };
  };

  const navigateMonth = (direction) => {
    const nextDate = new Date(currentDate);
    nextDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(nextDate);
  };

  const getEventsForDate = (date) => {
    return events.filter((event) => {
      const start = new Date(event.start);
      const end = new Date(event.end);
      const target = new Date(date);

      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      target.setHours(12, 0, 0, 0);

      return target >= start && target <= end;
    });
  };

  // Color mapper classes
  const getColorClasses = (color) => {
    switch (color) {
      case "green":
        return "bg-success/15 border-success/30 text-success";
      case "red":
        return "bg-danger/15 border-danger/30 text-danger";
      case "orange":
        return "bg-primary/15 border-primary/30 text-primary";
      case "purple":
        return "bg-purple-600/10 border-purple-600/30 text-purple-700";
      case "blue":
      default:
        return "bg-info/15 border-info/30 text-info";
    }
  };

  // Render Month View Grid
  const renderMonthView = () => {
    const { startDay, totalDays } = getDaysInMonth(currentDate);
    const dayCells = [];

    // Empty cells for preceding month
    for (let i = 0; i < startDay; i++) {
      dayCells.push(
        <div key={`empty-${i}`} className="min-h-[110px] border-b border-r border-border-slate bg-[#FAF7F2]/40 opacity-40" />
      );
    }

    // Days in current month
    for (let day = 1; day <= totalDays; day++) {
      const cellDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dateEvents = getEventsForDate(cellDate);
      const isToday = new Date().toDateString() === cellDate.toDateString();

      dayCells.push(
        <div
          key={`day-${day}`}
          className={`min-h-[110px] p-2 border-b border-r border-border-slate flex flex-col justify-between hover:bg-[#FAF7F2]/80 transition-colors ${
            isToday ? "bg-primary/5" : "bg-card-surface"
          }`}
        >
          <div className="flex justify-between items-start">
            <span
              className={`text-xs font-bold ${
                isToday ? "text-white bg-primary px-2 py-0.5 rounded-full shadow-subtle" : "text-muted-text"
              }`}
            >
              {day}
            </span>
          </div>

          <div className="mt-1.5 space-y-1 flex-1 overflow-y-auto max-h-20 custom-scrollbar">
            {dateEvents.slice(0, 3).map((event) => (
              <button
                key={event.id}
                onClick={() => setSelectedEvent(event)}
                className={`w-full text-left truncate text-[10px] px-2 py-0.5 rounded border ${getColorClasses(event.color)} font-bold cursor-pointer hover:opacity-85 transition`}
              >
                {event.title}
              </button>
            ))}
            {dateEvents.length > 3 && (
              <span className="text-[9px] text-muted-text block text-right font-semibold">+{dateEvents.length - 3} more</span>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="bg-card-surface border border-border-slate rounded-card overflow-hidden shadow-card">
        <div className="overflow-x-auto">
          <div className="min-w-[640px]">
            <div className="grid grid-cols-7 border-b border-border-slate bg-[#FAF7F2]">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((dayName) => (
                <div key={dayName} className="p-3 text-center text-xs font-bold text-muted-text uppercase tracking-wider">
                  {dayName}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 border-l border-t border-border-slate">
              {dayCells}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render Week View
  const renderWeekView = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const cellDate = new Date(startOfWeek);
      cellDate.setDate(startOfWeek.getDate() + i);
      weekDays.push(cellDate);
    }

    return (
      <div className="border border-border-slate rounded-card overflow-hidden bg-card-surface shadow-card">
        <div className="overflow-x-auto">
          <div className="min-w-[640px] grid grid-cols-7">
            {weekDays.map((day, idx) => {
          const dateEvents = getEventsForDate(day);
          const isToday = new Date().toDateString() === day.toDateString();
          return (
            <div key={idx} className={`min-h-[350px] border-r border-border-slate p-3 last:border-0 ${isToday ? "bg-primary/5" : ""}`}>
              <div className="text-center pb-3 border-b border-border-slate/60 mb-3">
                <span className="text-xs text-muted-text block font-bold uppercase tracking-wider">
                  {day.toLocaleDateString("en-US", { weekday: "short" })}
                </span>
                <span className={`text-base font-black block mt-1 ${isToday ? "text-primary" : "text-primary-text"}`}>
                  {day.getDate()}
                </span>
              </div>
              <div className="space-y-2">
                {dateEvents.map((event) => (
                  <button
                    key={event.id}
                    onClick={() => setSelectedEvent(event)}
                    className={`w-full text-left p-2 rounded-lg border text-xs ${getColorClasses(event.color)} font-semibold block transition-transform hover:-translate-y-0.5 cursor-pointer shadow-subtle`}
                  >
                    <span className="text-[9px] uppercase tracking-wider block opacity-75 mb-0.5 font-bold">{event.workspaceName}</span>
                    <span className="truncate block font-bold">{event.title}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
          </div>
        </div>
      </div>
    );
  };

  // Render Agenda/List View
  const renderListView = () => {
    const sortedEvents = [...events].sort((a, b) => new Date(a.start) - new Date(b.start));

    return (
      <div className="bg-card-surface border border-border-slate rounded-card overflow-hidden shadow-card">
        <div className="p-4 border-b border-border-slate bg-[#FAF7F2]">
          <h3 className="text-xs font-bold text-muted-text uppercase tracking-wider">All Workspace Tasks & Sprints</h3>
        </div>
        <div className="divide-y divide-border-slate">
          {sortedEvents.length > 0 ? (
            sortedEvents.map((event) => (
              <div
                key={event.id}
                onClick={() => setSelectedEvent(event)}
                className="p-4 hover:bg-[#FAF7F2] transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`w-3 h-3 rounded-full mt-1 shrink-0 ${
                      event.color === "green" ? "bg-success" :
                      event.color === "red" ? "bg-danger" :
                      event.color === "orange" ? "bg-primary" :
                      event.color === "purple" ? "bg-purple-600" : "bg-info"
                    }`}
                  />
                  <div>
                    <h4 className="font-bold text-primary-text text-sm">{event.title}</h4>
                    <p className="text-muted-text text-xs mt-0.5">{event.description}</p>
                    <span className="text-[10px] text-muted-text block mt-1.5 font-semibold">Workspace: {event.workspaceName}</span>
                  </div>
                </div>

                <div className="text-right text-xs shrink-0">
                  <span className="text-primary-text block font-bold">
                    {new Date(event.start).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                  {event.end && (
                    <span className="text-muted-text text-[10px] block mt-0.5">
                      Due: {new Date(event.end).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-muted-text text-xs font-semibold">
              📅 No workspace events or deadlines scheduled.
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-bg-base text-primary-text pt-28 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* SIDEBAR FILTERS & SUMMARY */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-card-surface border border-border-slate p-5 rounded-card space-y-6 shadow-card">
            {/* View Mode controls */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-muted-text uppercase tracking-widest block">Calendar Mode</span>
              <div className="flex flex-col gap-1.5 pt-1">
                <button
                  onClick={() => setViewMode("month")}
                  className={`w-full py-2.5 px-3 rounded-btn text-left text-xs font-bold cursor-pointer transition-colors ${
                    viewMode === "month" ? "bg-primary text-white shadow-subtle" : "bg-[#FAF7F2] hover:bg-[#F2ECE1] text-primary-text"
                  }`}
                >
                  📅 Month Grid
                </button>
                <button
                  onClick={() => setViewMode("week")}
                  className={`w-full py-2.5 px-3 rounded-btn text-left text-xs font-bold cursor-pointer transition-colors ${
                    viewMode === "week" ? "bg-primary text-white shadow-subtle" : "bg-[#FAF7F2] hover:bg-[#F2ECE1] text-primary-text"
                  }`}
                >
                  📊 Weekly Columns
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`w-full py-2.5 px-3 rounded-btn text-left text-xs font-bold cursor-pointer transition-colors ${
                    viewMode === "list" ? "bg-primary text-white shadow-subtle" : "bg-[#FAF7F2] hover:bg-[#F2ECE1] text-primary-text"
                  }`}
                >
                  📝 List Agenda
                </button>
              </div>
            </div>

            {/* Colors Legends */}
            <div className="space-y-3 pt-4 border-t border-border-slate">
              <span className="text-[10px] font-bold text-muted-text uppercase tracking-widest block">Event Legends</span>
              <div className="space-y-2 text-xs font-medium">
                <div className="flex items-center gap-2 text-primary-text">
                  <span className="w-2.5 h-2.5 rounded-full bg-info shrink-0" />
                  <span>Tasks (Standard)</span>
                </div>
                <div className="flex items-center gap-2 text-primary-text">
                  <span className="w-2.5 h-2.5 rounded-full bg-success shrink-0" />
                  <span>Tasks (Completed)</span>
                </div>
                <div className="flex items-center gap-2 text-primary-text">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary shrink-0" />
                  <span>Tasks (High Priority)</span>
                </div>
                <div className="flex items-center gap-2 text-primary-text">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-600 shrink-0" />
                  <span>Sprint Timelines</span>
                </div>
                <div className="flex items-center gap-2 text-primary-text">
                  <span className="w-2.5 h-2.5 rounded-full bg-danger shrink-0" />
                  <span>Overdue Deadlines</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CALENDAR BODY */}
        <div className="lg:col-span-9 space-y-6">
          {/* Calendar Header Navigator */}
          <div className="flex justify-between items-center bg-card-surface border border-border-slate p-4 rounded-card shadow-subtle">
            <h2 className="text-base md:text-lg font-black text-primary-text tracking-tight">
              {viewMode === "month" && currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              {viewMode === "week" && `Week of ${currentDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
              {viewMode === "list" && "Workspace Backlog Agenda"}
            </h2>

            {viewMode !== "list" && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => navigateMonth(viewMode === "month" ? -1 : -7)}
                  className="w-8 h-8 rounded-btn border border-border-slate bg-[#FAF7F2] hover:bg-[#F2ECE1] flex items-center justify-center text-xs cursor-pointer font-bold text-primary-text transition"
                >
                  ◀
                </button>
                <button
                  onClick={() => setCurrentDate(new Date())}
                  className="px-3 h-8 rounded-btn border border-border-slate bg-[#FAF7F2] hover:bg-[#F2ECE1] text-xs font-bold cursor-pointer text-primary-text transition"
                >
                  Today
                </button>
                <button
                  onClick={() => navigateMonth(viewMode === "month" ? 1 : 7)}
                  className="w-8 h-8 rounded-btn border border-border-slate bg-[#FAF7F2] hover:bg-[#F2ECE1] flex items-center justify-center text-xs cursor-pointer font-bold text-primary-text transition"
                >
                  ▶
                </button>
              </div>
            )}
          </div>

          {loading ? (
            <div className="bg-card-surface border border-border-slate p-20 rounded-card flex flex-col justify-center items-center shadow-card space-y-3">
              <div className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
              <p className="text-xs font-semibold text-muted-text">Aggregating workspace sprints and deadlines...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-danger/10 border border-danger/20 text-danger text-xs rounded-card text-center font-semibold">
              {error}
            </div>
          ) : (
            <>
              {viewMode === "month" && renderMonthView()}
              {viewMode === "week" && renderWeekView()}
              {viewMode === "list" && renderListView()}
            </>
          )}
        </div>
      </div>

      {/* EVENT DETAILED DIALOG */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-secondary-charcoal/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-card-surface border border-border-slate w-full max-w-md rounded-card p-6 space-y-4 shadow-modal">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] text-muted-text uppercase tracking-widest font-bold block">{selectedEvent.workspaceName}</span>
                <h3 className="font-black text-primary-text text-lg mt-0.5">{selectedEvent.title}</h3>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="w-7 h-7 rounded-full bg-[#FAF7F2] border border-border-slate flex items-center justify-center text-xs text-muted-text hover:text-primary-text transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-primary-text text-xs leading-relaxed py-1">
              {selectedEvent.description}
            </p>

            <div className="border-t border-border-slate pt-3 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-text">Event Type:</span>
                <span className="font-bold text-primary-text capitalize">{selectedEvent.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-text">Date Range:</span>
                <span className="font-bold text-primary-text">
                  {new Date(selectedEvent.start).toLocaleDateString()}
                  {selectedEvent.end && ` - ${new Date(selectedEvent.end).toLocaleDateString()}`}
                </span>
              </div>
              {selectedEvent.status && (
                <div className="flex justify-between">
                  <span className="text-muted-text">Current Status:</span>
                  <span className="font-bold text-primary-text capitalize">{selectedEvent.status}</span>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 gap-2">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 border border-border-slate text-muted-text hover:text-primary-text hover:bg-[#FAF7F2] rounded-btn text-xs font-bold"
              >
                Close
              </button>
              <Link
                to={`/workspace/${selectedEvent.workspaceId}`}
                className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-btn text-xs font-bold text-center shadow-subtle"
              >
                Open Workspace ↗
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
