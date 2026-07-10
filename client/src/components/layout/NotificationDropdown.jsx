import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useSocket } from "../../context/SocketContext";
import { formatDate } from "../../utils/helpers";

const typeIcons = {
  application_submitted: (
    <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/15">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2" />
      </svg>
    </div>
  ),
  application_accepted: (
    <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/15">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>
  ),
  application_rejected: (
    <div className="w-8 h-8 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/15">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>
  ),
  chat_message: (
    <div className="w-8 h-8 rounded-full bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/15">
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

    // Router redirect based on notification triggers
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
      {/* Bell Action trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/5 transition-all cursor-pointer"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute top-1 right-1 w-4 h-4 bg-purple-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border border-[#0a0a0f]"
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
            className="absolute right-0 mt-3.5 w-80 sm:w-96 glass border border-purple-500/20 bg-[#111118]/95 rounded-2xl shadow-2xl overflow-hidden z-50"
          >
            {/* Header */}
            <div className="p-4 border-b border-purple-500/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm">Notifications Feed</span>
                {unreadCount > 0 && (
                  <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full font-bold">
                    {unreadCount} new
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-[11px] text-purple-400 hover:text-purple-300 font-bold cursor-pointer"
                >
                  Mark all as read
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-[360px] overflow-y-auto divide-y divide-purple-500/5">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-xs">
                  <svg className="w-8 h-8 mx-auto text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <span>No notifications yet.</span>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification._id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 flex gap-3 hover:bg-white/[0.02] cursor-pointer transition-colors ${
                      !notification.read ? "bg-purple-500/[0.02]" : ""
                    }`}
                  >
                    {typeIcons[notification.type] || typeIcons.chat_message}

                    <div className="flex-1 space-y-0.5 min-w-0">
                      <p className={`text-xs text-gray-300 leading-normal ${!notification.read ? "text-white font-medium" : ""}`}>
                        {notification.content}
                      </p>
                      <span className="text-[9px] text-gray-500 block">
                        {formatDate(notification.createdAt)}
                      </span>
                    </div>

                    {!notification.read && (
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400 self-center shrink-0" />
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
