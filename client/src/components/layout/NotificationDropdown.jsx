import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useSocket } from "../../context/SocketContext";
import { formatDate } from "../../utils/helpers";

const typeIcons = {
  application_submitted: (
    <div className="w-8 h-8 rounded-xl bg-primary-tint text-primary flex items-center justify-center shrink-0 border border-primary/20">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2" />
      </svg>
    </div>
  ),
  application_accepted: (
    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>
  ),
  application_rejected: (
    <div className="w-8 h-8 rounded-xl bg-red-50 text-danger flex items-center justify-center shrink-0 border border-red-200">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>
  ),
  chat_message: (
    <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    </div>
  ),
};

const NotificationDropdown = () => {
  const { notifications, unreadCount, markSingleRead, markAllRead } = useSocket();
  const [isOpen, setIsOpen] = useState(false);
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

  const handleNotificationClick = async (notification) => {
    setIsOpen(false);
    if (!notification.read) {
      await markSingleRead(notification._id);
    }

    if (notification.type === "application_submitted") {
      navigate(`/projects/${notification.project?._id || notification.project}/applications`);
    } else if (
      notification.type === "application_accepted" ||
      notification.type === "application_rejected"
    ) {
      navigate("/applications");
    } else if (notification.type === "chat_message") {
      navigate("/chat");
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-btn text-text-secondary hover:text-charcoal bg-white border border-border-slate hover:border-primary/40 hover:bg-primary-tint/30 transition-all cursor-pointer"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.75}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-primary text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-[#F8F5EF] shadow-orange-sm"
            >
              {unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="absolute -right-8 sm:right-0 mt-3 w-[calc(100vw-2rem)] sm:w-96 max-w-sm bg-card-surface border border-border-slate rounded-card shadow-modal overflow-hidden z-50"
          >
            <div className="p-4 border-b border-border-slate bg-[#FAF8F4] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-charcoal text-sm">Notifications Feed</span>
                {unreadCount > 0 && (
                  <span className="text-[10px] bg-primary-tint text-primary border border-primary/20 px-2 py-0.5 rounded-full font-bold">
                    {unreadCount} new
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-primary hover:text-primary-hover font-bold cursor-pointer"
                >
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-[360px] overflow-y-auto divide-y divide-border-slate/60">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-text-muted text-xs">
                  <div className="w-10 h-10 rounded-full bg-[#F8F5EF] mx-auto mb-3 flex items-center justify-center text-base">
                    🔔
                  </div>
                  <span>No notifications yet.</span>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification._id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-3.5 flex gap-3 hover:bg-[#FBF8F3] cursor-pointer transition-colors ${
                      !notification.read ? "bg-primary-tint/20 border-l-2 border-primary" : ""
                    }`}
                  >
                    {typeIcons[notification.type] || typeIcons.chat_message}

                    <div className="flex-1 space-y-0.5 min-w-0">
                      <p className={`text-xs text-text-secondary leading-normal ${!notification.read ? "text-charcoal font-semibold" : ""}`}>
                        {notification.content}
                      </p>
                      <span className="text-[10px] text-text-muted block">
                        {formatDate(notification.createdAt)}
                      </span>
                    </div>

                    {!notification.read && (
                      <span className="w-2 h-2 rounded-full bg-primary self-center shrink-0" />
                    )}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationDropdown;
