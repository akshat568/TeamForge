import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import useScrollY from "../../hooks/useScrollY";
import { useAuth } from "../../context/AuthContext";
import NotificationCenter from "./NotificationCenter";
import api from "../../services/api";

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [workspaces, setWorkspaces] = useState([]);
  const [workspacesOpen, setWorkspacesOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const scrollY = useScrollY();
  const location = useLocation();
  const isScrolled = scrollY > 20;

  const isActive = (path) => location.pathname === path;

  // Fetch user workspaces on authentication state change
  useEffect(() => {
    const fetchWorkspaces = async () => {
      if (!isAuthenticated) {
        setWorkspaces([]);
        return;
      }
      try {
        const res = await api.get("/projects/user-workspaces");
        if (res.data.success) {
          setWorkspaces(res.data.workspaces);
        }
      } catch (e) {
        console.error("Failed to load workspaces for Navbar:", e.message);
      }
    };
    fetchWorkspaces();
  }, [isAuthenticated]);

  const links = [
    { label: "Home", path: "/" },
    { label: "About", path: "/about" },
    { label: "Browse Projects", path: "/projects" },
    { label: "Find Teammates", path: "/users" },
    ...(isAuthenticated
      ? [
          { label: "Dashboard", path: "/dashboard" },
          { label: "Calendar", path: "/calendar" },
          { label: "Chat", path: "/chat" },
        ]
      : []),
  ];

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "backdrop-blur-md bg-bg-base/85 border-b border-border-slate/70 shadow-subtle"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        
        {/* Left Section: Dedicated Logo with fixed width */}
        <div className="w-[250px] flex items-center shrink-0">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl gradient-bg flex items-center justify-center glow-sm group-hover:scale-110 transition-transform duration-200">
              <span className="text-white font-black text-lg">T</span>
            </div>
            <span className="text-xl font-bold text-white tracking-tight">
              Team<span className="gradient-text">Forge</span>
            </span>
          </Link>
        </div>

        {/* Center Section: Navigation Links with single line white-space nowrap and 32-36px spacing */}
        <nav className="hidden md:flex items-center gap-[32px] lg:gap-[36px] flex-1 justify-start">
          {links.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`text-[17px] font-medium transition-colors duration-200 relative group whitespace-nowrap ${
                isActive(link.path)
                  ? "text-primary-light"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {link.label}
              <span
                className={`absolute -bottom-1 left-0 h-0.5 bg-primary transition-all duration-200 ${
                  isActive(link.path) ? "w-full" : "w-0 group-hover:w-full"
                }`}
              />
            </Link>
          ))}

          {/* Workspaces Hover Dropdown */}
          {isAuthenticated && workspaces.length > 0 && (
            <div
              className="relative"
              onMouseEnter={() => setWorkspacesOpen(true)}
              onMouseLeave={() => setWorkspacesOpen(false)}
            >
              <button className="text-[17px] font-medium text-gray-400 hover:text-white transition-colors py-1 flex items-center gap-1 cursor-pointer whitespace-nowrap">
                Workspaces
                <svg
                  className={`w-3 h-3 transform transition-transform duration-200 ${
                    workspacesOpen ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <AnimatePresence>
                {workspacesOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute left-0 mt-2 w-56 glass border border-border-slate bg-bg-secondary rounded-xl shadow-xl overflow-hidden py-1.5 z-50"
                  >
                    {workspaces.map((w) => (
                      <Link
                        key={w._id}
                        to={`/workspace/${w._id}`}
                        onClick={() => setWorkspacesOpen(false)}
                        className="block px-4 py-2.5 text-xs text-gray-300 hover:text-white hover:bg-white/5 transition-colors truncate"
                      >
                        {w.title}
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </nav>

        {/* Right Section: Compact user actions with notifications and profile dropdown */}
        <div className="hidden md:flex items-center gap-4 shrink-0">
          {isAuthenticated ? (
            <div className="flex items-center gap-4 relative">
              <NotificationCenter />
              
              <div
                className="relative"
                onMouseEnter={() => setProfileOpen(true)}
                onMouseLeave={() => setProfileOpen(false)}
              >
                <button className="flex items-center gap-2 group cursor-pointer focus:outline-none py-1">
                  <div className="w-8 h-8 rounded-full gradient-bg flex items-center justify-center font-bold text-xs text-white group-hover:scale-105 transition-transform duration-200 border border-white/10 shadow-sm">
                    {user?.name
                      ? user.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)
                      : "TF"}
                  </div>
                  <span className="text-[17px] font-medium text-gray-300 group-hover:text-white transition-colors duration-200 whitespace-nowrap">
                    {user?.name?.split(" ")[0]}
                  </span>
                  <svg
                    className={`w-3.5 h-3.5 text-gray-400 group-hover:text-white transform transition-transform duration-200 ${
                      profileOpen ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-48 glass border border-border-slate bg-bg-secondary rounded-xl shadow-xl overflow-hidden py-1.5 z-50"
                    >
                      <Link
                        to="/profile"
                        onClick={() => setProfileOpen(false)}
                        className="block px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                      >
                        👤 Profile
                      </Link>
                      <Link
                        to="/profile"
                        onClick={() => setProfileOpen(false)}
                        className="block px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                      >
                        ⚙️ Settings
                      </Link>
                      <hr className="border-border-slate/40 my-1" />
                      <button
                        onClick={() => {
                          setProfileOpen(false);
                          logout();
                        }}
                        className="w-full text-left block px-4 py-2.5 text-sm text-danger hover:text-red-400 hover:bg-white/5 transition-colors cursor-pointer"
                      >
                        🚪 Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm font-medium text-gray-300 hover:text-white px-4 py-2 rounded-lg transition-colors duration-200 hover:bg-white/5"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="text-sm font-semibold text-white px-5 py-2 rounded-xl gradient-bg glow-sm hover:opacity-90 transition-all duration-200 hover:scale-105"
              >
                Register
              </Link>
            </>
          )}
        </div>

        {/* Mobile Nav Actions (Dropdown + Hamburg) */}
        <div className="flex md:hidden items-center gap-2">
          {isAuthenticated && <NotificationCenter />}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex flex-col gap-1.5 p-2 rounded-lg hover:bg-white/5 transition-colors"
            aria-label="Toggle menu"
          >
            <motion.span
              animate={menuOpen ? { rotate: 45, y: 8 } : { rotate: 0, y: 0 }}
              className="block w-6 h-0.5 bg-gray-300"
            />
            <motion.span
              animate={menuOpen ? { opacity: 0 } : { opacity: 1 }}
              className="block w-6 h-0.5 bg-gray-300"
            />
            <motion.span
              animate={menuOpen ? { rotate: -45, y: -8 } : { rotate: 0, y: 0 }}
              className="block w-6 h-0.5 bg-gray-300"
            />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="md:hidden glass border-t border-border-slate overflow-hidden"
          >
            <div className="px-6 py-4 flex flex-col gap-4">
              {links.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMenuOpen(false)}
                  className={`text-sm font-medium ${
                    isActive(link.path) ? "text-primary-light" : "text-gray-400"
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              {/* Mobile Workspaces list */}
              {isAuthenticated && workspaces.length > 0 && (
                <div className="flex flex-col gap-2 pt-1 border-t border-border-slate/50">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">
                    My Workspaces
                  </span>
                  {workspaces.map((w) => (
                    <Link
                      key={w._id}
                      to={`/workspace/${w._id}`}
                      onClick={() => setMenuOpen(false)}
                      className="text-sm font-medium text-primary-light pl-4 py-1 hover:text-blue-300 truncate"
                    >
                      ↳ {w.title}
                    </Link>
                  ))}
                </div>
              )}

              <div className="flex flex-col gap-2 pt-2 border-t border-border-slate">
                {isAuthenticated ? (
                  <>
                    <Link
                      to="/profile"
                      onClick={() => setMenuOpen(false)}
                      className="text-sm font-medium text-gray-300 hover:text-white py-2 text-center rounded-lg hover:bg-white/5 transition"
                    >
                      👤 My Profile ({user?.name})
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setMenuOpen(false);
                      }}
                      className="text-sm font-semibold text-white py-2 text-center rounded-xl bg-red-600/80 hover:bg-red-600 transition cursor-pointer"
                    >
                      🚪 Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setMenuOpen(false)}
                      className="text-sm font-medium text-gray-300 hover:text-white py-2 text-center rounded-lg hover:bg-white/5 transition"
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setMenuOpen(false)}
                      className="text-sm font-semibold text-white py-2 text-center rounded-xl gradient-bg"
                    >
                      Register
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};

export default Navbar;
