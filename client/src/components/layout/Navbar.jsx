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
  const isScrolled = scrollY > 15;

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
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-[#F8F5EF]/92 backdrop-blur-md border-b border-[#E9E4DA] shadow-subtle py-3.5"
          : "bg-[#F8F5EF]/60 backdrop-blur-sm border-b border-transparent py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        
        {/* Left Section: Brand Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-orange-sm group-hover:scale-105 transition-all duration-200">
              <span className="text-white font-extrabold text-lg tracking-wider">TF</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-extrabold text-charcoal tracking-tight leading-none">
                Team<span className="text-primary">Forge</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-[0.16em] text-text-muted mt-0.5">
                Builder Network
              </span>
            </div>
          </Link>
        </div>

        {/* Center Section: Navigation Links */}
        <nav className="hidden lg:flex items-center gap-4 xl:gap-7 justify-center">
          {links.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`text-[14px] xl:text-[15px] font-semibold transition-all duration-200 relative py-1.5 whitespace-nowrap ${
                isActive(link.path)
                  ? "text-primary"
                  : "text-text-secondary hover:text-charcoal"
              }`}
            >
              {link.label}
              {isActive(link.path) && (
                <motion.span
                  layoutId="navActiveIndicator"
                  className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary rounded-full"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </Link>
          ))}

          {/* Workspaces Hover Dropdown */}
          {isAuthenticated && workspaces.length > 0 && (
            <div
              className="relative"
              onMouseEnter={() => setWorkspacesOpen(true)}
              onMouseLeave={() => setWorkspacesOpen(false)}
            >
              <button className="text-[15px] font-semibold text-text-secondary hover:text-charcoal transition-colors py-1.5 flex items-center gap-1.5 cursor-pointer whitespace-nowrap">
                <span>Workspaces</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary-tint text-primary font-bold border border-primary/20">
                  {workspaces.length}
                </span>
                <svg
                  className={`w-3.5 h-3.5 text-text-muted transition-transform duration-200 ${
                    workspacesOpen ? "rotate-180 text-primary" : ""
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
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.18 }}
                    className="absolute left-0 mt-1 w-64 bg-card-surface border border-border-slate rounded-card shadow-premium overflow-hidden py-2 z-50"
                  >
                    <div className="px-3.5 py-1.5 text-[10px] font-bold text-text-muted uppercase tracking-wider border-b border-border-slate mb-1">
                      Active Workspaces
                    </div>
                    {workspaces.map((w) => (
                      <Link
                        key={w._id}
                        to={`/workspace/${w._id}`}
                        onClick={() => setWorkspacesOpen(false)}
                        className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-charcoal hover:bg-primary-tint hover:text-primary transition-colors truncate"
                      >
                        <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                        <span className="truncate font-medium">{w.title}</span>
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </nav>

        {/* Right Section: Compact user actions & Notifications */}
        <div className="hidden lg:flex items-center gap-3.5 shrink-0">
          {isAuthenticated ? (
            <div className="flex items-center gap-3.5 relative">
              <NotificationCenter />
              
              <div
                className="relative"
                onMouseEnter={() => setProfileOpen(true)}
                onMouseLeave={() => setProfileOpen(false)}
              >
                <button className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-btn hover:bg-white/80 border border-transparent hover:border-border-slate transition-all cursor-pointer focus:outline-none">
                  <div className="w-8 h-8 rounded-full bg-charcoal text-white flex items-center justify-center font-bold text-xs border border-charcoal/10 shadow-subtle">
                    {user?.name
                      ? user.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)
                      : "TF"}
                  </div>
                  <span className="text-sm font-semibold text-charcoal max-w-[120px] truncate">
                    {user?.name?.split(" ")[0]}
                  </span>
                  <svg
                    className={`w-3.5 h-3.5 text-text-muted transform transition-transform duration-200 ${
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
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.18 }}
                      className="absolute right-0 mt-1 w-52 bg-card-surface border border-border-slate rounded-card shadow-premium overflow-hidden py-1.5 z-50"
                    >
                      <div className="px-4 py-2 border-b border-border-slate">
                        <p className="text-xs font-bold text-charcoal truncate">{user?.name}</p>
                        <p className="text-[11px] text-text-muted truncate">{user?.email}</p>
                      </div>
                      <Link
                        to="/profile"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-text-secondary hover:text-charcoal hover:bg-primary-tint transition-colors"
                      >
                        <svg className="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span>My Profile</span>
                      </Link>
                      <Link
                        to="/applications"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-text-secondary hover:text-charcoal hover:bg-primary-tint transition-colors"
                      >
                        <svg className="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <span>My Applications</span>
                      </Link>
                      <hr className="border-border-slate my-1" />
                      <button
                        onClick={() => {
                          setProfileOpen(false);
                          logout();
                        }}
                        className="w-full text-left flex items-center gap-2.5 px-4 py-2.5 text-sm text-danger hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        <svg className="w-4 h-4 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span>Sign Out</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="text-sm font-semibold text-charcoal hover:text-primary px-4 py-2 rounded-btn transition-colors duration-150"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="text-sm font-bold text-white px-5 py-2.5 rounded-btn bg-primary hover:bg-primary-hover shadow-orange-sm transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
              >
                Get Started Free
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Toggle */}
        <div className="flex lg:hidden items-center gap-2">
          {isAuthenticated && <NotificationCenter />}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 rounded-btn bg-white border border-border-slate text-charcoal hover:bg-primary-tint transition-colors"
            aria-label="Toggle menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="lg:hidden bg-card-surface border-t border-border-slate shadow-premium overflow-hidden"
          >
            <div className="px-6 py-5 flex flex-col gap-3">
              {links.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMenuOpen(false)}
                  className={`text-sm font-semibold py-1.5 ${
                    isActive(link.path) ? "text-primary" : "text-text-secondary hover:text-charcoal"
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              {/* Mobile Workspaces list */}
              {isAuthenticated && workspaces.length > 0 && (
                <div className="flex flex-col gap-2 pt-2 border-t border-border-slate">
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                    My Workspaces
                  </span>
                  {workspaces.map((w) => (
                    <Link
                      key={w._id}
                      to={`/workspace/${w._id}`}
                      onClick={() => setMenuOpen(false)}
                      className="text-sm font-medium text-charcoal hover:text-primary pl-2 py-1 truncate"
                    >
                      ↳ {w.title}
                    </Link>
                  ))}
                </div>
              )}

              <div className="flex flex-col gap-2 pt-3 border-t border-border-slate">
                {isAuthenticated ? (
                  <>
                    <Link
                      to="/profile"
                      onClick={() => setMenuOpen(false)}
                      className="text-sm font-semibold text-charcoal py-2 text-center rounded-btn bg-[#F8F5EF] hover:bg-primary-tint transition"
                    >
                      My Profile ({user?.name})
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setMenuOpen(false);
                      }}
                      className="text-sm font-bold text-white py-2 text-center rounded-btn bg-danger hover:opacity-90 transition cursor-pointer"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setMenuOpen(false)}
                      className="text-sm font-semibold text-charcoal py-2.5 text-center rounded-btn bg-[#F8F5EF] hover:bg-primary-tint transition"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setMenuOpen(false)}
                      className="text-sm font-bold text-white py-2.5 text-center rounded-btn bg-primary hover:bg-primary-hover shadow-orange-sm"
                    >
                      Get Started Free
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
