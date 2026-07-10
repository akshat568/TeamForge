import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useSocket } from "../../context/SocketContext";
import { getNotifications } from "../../services/notificationService";

// Helper function for relative time formatting
const formatRelativeTime = (dateInput) => {
  if (!dateInput) return "";
  const now = new Date();
  const date = new Date(dateInput);
  const diffMs = now - date;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHrs = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHrs / 24);

  if (diffSecs < 60) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHrs < 24) return `${diffHrs}h ago`;
  if (diffDays === 1) return "yesterday";
  return `${diffDays}d ago`;
};

// Premium SVG Icons mapped to each notification category type
const CategoryIcons = {
  task: (
    <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/15">
      📋
    </div>
  ),
  task_completed: (
    <div className="w-8 h-8 rounded-xl bg-success/10 text-success flex items-center justify-center shrink-0 border border-success/15">
      ✅
    </div>
  ),
  document: (
    <div className="w-8 h-8 rounded-xl bg-info/10 text-info flex items-center justify-center shrink-0 border border-info/15">
      📄
    </div>
  ),
  github: (
    <div className="w-8 h-8 rounded-xl bg-warning/10 text-warning flex items-center justify-center shrink-0 border border-warning/15">
      🐙
    </div>
  ),
  resource: (
    <div className="w-8 h-8 rounded-xl bg-info/10 text-info flex items-center justify-center shrink-0 border border-info/15">
      📁
    </div>
  ),
  member: (
    <div className="w-8 h-8 rounded-xl bg-danger/10 text-danger flex items-center justify-center shrink-0 border border-danger/15">
      👤
    </div>
  ),
  warning: (
    <div className="w-8 h-8 rounded-xl bg-warning/10 text-warning flex items-center justify-center shrink-0 border border-warning/15 animate-pulse">
      ⚠️
    </div>
  ),
};

const getCategoryKey = (type) => {
  if (type.startsWith("task_completed")) return "task_completed";
  if (type.startsWith("task")) return "task";
  if (type.startsWith("document")) return "document";
  if (type.startsWith("github")) return "github";
  if (type.startsWith("resource")) return "resource";
  if (type.startsWith("member") || type.startsWith("application")) return "member";
  return "warning";
};

const NotificationCenter = () => {
  const {
    notifications,
    setNotifications,
    unreadCount,
    setUnreadCount,
    markSingleRead,
    markAllRead,
    deleteSingleNotification,
    clearReadNotifications
  } = useSocket();

  const [isOpen, setIsOpen] = useState(false);
  const [filterType, setFilterType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [apiError, setApiError] = useState("");

  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Keyboard accessibility: Close on Escape keypress
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Fetch more notifications for pagination / infinite scroll
  const loadMoreNotifications = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    setApiError("");
    try {
      const nextPage = page + 1;
      const data = await getNotifications(nextPage, 25);
      if (data.success) {
        if (data.notifications.length === 0) {
          setHasMore(false);
        } else {
          setNotifications((prev) => {
            const merged = [...prev];
            data.notifications.forEach((newN) => {
              if (!merged.some((m) => m._id === newN._id)) {
                merged.push(newN);
              }
            });
            return merged;
          });
          setPage(nextPage);
        }
      }
    } catch (err) {
      console.error("Pagination load failed:", err.message);
      setApiError("Failed to fetch more logs");
    } finally {
      setLoadingMore(false);
    }
  };

  // Filter and Sort calculations memoized for rendering performance
  const processedNotifications = useMemo(() => {
    let list = [...notifications];

    // 1. Search Query Matcher
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      list = list.filter(
        (n) =>
          n.title?.toLowerCase().includes(query) ||
          n.message?.toLowerCase().includes(query) ||
          n.content?.toLowerCase().includes(query) ||
          n.sender?.name?.toLowerCase().includes(query)
      );
    }

    // 2. Category filters
    if (filterType !== "all") {
      list = list.filter((n) => {
        const cat = getCategoryKey(n.type);
        if (filterType === "tasks") return cat === "task" || cat === "task_completed";
        if (filterType === "documents") return cat === "document";
        if (filterType === "github") return cat === "github";
        if (filterType === "resources") return cat === "resource";
        if (filterType === "members") return cat === "member";
        return true;
      });
    }

    // 3. Sorting orders
    list.sort((a, b) => {
      if (sortOrder === "newest") {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
      if (sortOrder === "oldest") {
        return new Date(a.createdAt) - new Date(b.createdAt);
      }
      if (sortOrder === "unread") {
        if (a.read === b.read) {
          return new Date(b.createdAt) - new Date(a.createdAt); // Secondary sort newest
        }
        return a.read ? 1 : -1;
      }
      return 0;
    });

    return list;
  }, [notifications, searchQuery, filterType, sortOrder]);

  const handleNotificationClick = async (n) => {
    setIsOpen(false);
    if (!n.read) {
      await markSingleRead(n._id);
    }

    // Dynamic Navigation Routing
    if (n.project?._id || n.project) {
      const pId = n.project._id || n.project;
      if (n.type.startsWith("task")) {
        navigate(`/workspace/${pId}?tab=tasks`);
      } else if (n.type.startsWith("document")) {
        navigate(`/workspace/${pId}?tab=documents`);
      } else if (n.type.startsWith("resource")) {
        navigate(`/workspace/${pId}?tab=resources`);
      } else if (n.type.startsWith("github")) {
        navigate(`/workspace/${pId}?tab=github`);
      } else if (n.type.startsWith("member") || n.type.startsWith("application")) {
        navigate(`/workspace/${pId}`);
      } else {
        navigate(`/workspace/${pId}`);
      }
    } else if (n.type === "chat_message") {
      navigate("/chat");
    }
  };

  const handleMarkAsReadClick = async (e, id) => {
    e.stopPropagation();
    await markSingleRead(id);
  };

  const handleDeleteClick = async (e, id) => {
    e.stopPropagation();
    await deleteSingleNotification(id);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Action trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle notifications panel"
        className="relative p-2 rounded-btn text-gray-400 hover:text-white hover:bg-hover-surface border border-transparent hover:border-border-slate transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50"
      >
        <motion.div
          animate={unreadCount > 0 ? {
            rotate: [0, 15, -15, 10, -10, 5, -5, 0],
            transition: { repeat: Infinity, duration: 2, repeatDelay: 3 }
          } : {}}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
        </motion.div>

        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute top-1 right-1 w-4 h-4 bg-primary text-white text-[9px] font-black rounded-full flex items-center justify-center border border-bg-base"
            >
              {unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {/* Dropdown Box overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-3.5 w-80 sm:w-96 md:w-[420px] bg-bg-secondary border border-border-slate rounded-modal shadow-premium overflow-hidden z-50 flex flex-col max-h-[580px]"
          >
            {/* Header controls block */}
            <div className="p-4 border-b border-border-slate flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm">Notifications</span>
                {unreadCount > 0 && (
                  <span className="text-[10px] bg-primary/10 text-primary-light border border-primary/20 px-2 py-0.5 rounded-full font-bold">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[11px] text-primary hover:text-primary-hover font-bold cursor-pointer transition-colors"
                  >
                    Mark read
                  </button>
                )}
                {notifications.some(n => n.read) && (
                  <button
                    onClick={clearReadNotifications}
                    className="text-[11px] text-gray-400 hover:text-white font-medium cursor-pointer transition-colors"
                  >
                    Clear read
                  </button>
                )}
              </div>
            </div>

            {/* Local Search and Sorting Options */}
            <div className="p-3 bg-white/[0.01] border-b border-border-slate flex flex-col gap-2 shrink-0">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search logs..."
                  className="flex-1 bg-card-surface/85 border border-border-slate focus:border-primary rounded-input py-1.5 px-3 text-xs text-white outline-none"
                />
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="bg-card-surface/85 border border-border-slate rounded-input py-1.5 px-2 text-[10px] text-gray-300 outline-none"
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="unread">Unread first</option>
                </select>
              </div>

              {/* Categories filters scroll tab */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                {["all", "tasks", "documents", "github", "resources", "members"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFilterType(cat)}
                    className={`px-2.5 py-1 rounded-lg text-[9px] font-bold capitalize transition-all shrink-0 cursor-pointer ${
                      filterType === cat
                        ? "bg-primary/10 text-primary-light border border-primary/30"
                        : "bg-white/5 text-gray-400 hover:text-white border border-transparent"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Notifications Feed list body */}
            <div className="overflow-y-auto flex-1 divide-y divide-border-slate/50 min-h-[150px] max-h-[360px]">
              {apiError && (
                <div className="p-4 text-center text-xs text-red-400 bg-red-500/5">
                  {apiError}
                </div>
              )}

              {processedNotifications.length === 0 ? (
                <div className="py-12 text-center text-gray-500 text-xs flex flex-col items-center justify-center gap-2">
                  <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <span>No matching notifications found.</span>
                </div>
              ) : (
                processedNotifications.map((n) => {
                  const catKey = getCategoryKey(n.type);
                  return (
                    <div
                      key={n._id}
                      onClick={() => handleNotificationClick(n)}
                      className={`p-4 flex gap-3 hover:bg-hover-surface cursor-pointer transition-all duration-200 border-l-2 relative group ${
                        !n.read ? "border-primary bg-primary/[0.01]" : "border-transparent"
                      }`}
                    >
                      {/* Left icon placeholder */}
                      {CategoryIcons[catKey] || CategoryIcons.warning}

                      {/* Content block */}
                      <div className="flex-1 space-y-1 min-w-0">
                        {n.title && (
                          <h4 className={`text-xs font-bold truncate leading-none ${!n.read ? "text-primary-light" : "text-gray-300"}`}>
                            {n.title}
                          </h4>
                        )}
                        <p className={`text-xs text-gray-300 leading-normal break-words ${!n.read ? "text-white font-medium" : ""}`}>
                          {n.message || n.content}
                        </p>
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[9px] text-gray-500 font-medium">
                            {formatRelativeTime(n.createdAt)}
                          </span>
                          {n.project?.title && (
                            <span className="text-[8px] bg-primary/10 text-primary-light px-1.5 py-0.5 rounded border border-primary/10 truncate max-w-[120px]">
                              {n.project.title}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right hover action button overlays */}
                      <div className="flex flex-col gap-2 shrink-0 items-center justify-center">
                        {!n.read && (
                          <button
                            onClick={(e) => handleMarkAsReadClick(e, n._id)}
                            className="p-1 rounded bg-primary/10 hover:bg-primary/20 text-primary-light hover:text-white transition-all cursor-pointer"
                            title="Mark as read"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                        )}
                        <button
                          onClick={(e) => handleDeleteClick(e, n._id)}
                          className="p-1 rounded bg-red-500/5 hover:bg-red-500/10 text-gray-400 hover:text-danger transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                          title="Delete notification"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Pagination Load More footer trigger */}
            {hasMore && processedNotifications.length > 0 && searchQuery === "" && (
              <div className="p-3 bg-white/[0.01] border-t border-border-slate text-center shrink-0">
                <button
                  onClick={loadMoreNotifications}
                  disabled={loadingMore}
                  className="text-[10px] font-bold text-primary hover:text-primary-hover transition-colors uppercase tracking-wider cursor-pointer disabled:opacity-50"
                >
                  {loadingMore ? "Loading..." : "Load More Notifications"}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationCenter;
