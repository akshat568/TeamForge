import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import userService from "../services/userService";

const Profile = () => {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  // If no ID is provided in url, we are viewing our own profile
  const profileId = id || (currentUser ? currentUser.id || currentUser._id : null);

  const [profileUser, setProfileUser] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [projects, setProjects] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Tabs state
  const [activeTab, setActiveTab] = useState("overview");

  // Edit profile states
  const [editOpen, setEditOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: "",
    bio: "",
    skills: "",
    college: "",
    branch: "",
    year: "",
    location: "",
    portfolio: "",
    leetcode: "",
    codeforces: "",
    website: "",
    github: "",
    linkedin: "",
    preferredRoles: "",
    interests: "",
    availability: "Available"
  });

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

  const isMe = currentUser && profileId && (currentUser.id === profileId || currentUser._id === profileId);

  useEffect(() => {
    if (!profileId) {
      setError("No user ID specified and you are not logged in.");
      setLoading(false);
      return;
    }

    const fetchProfileData = async () => {
      try {
        setLoading(true);
        setError("");

        // 1. Get profile details & analytics
        const profileRes = await userService.getUserProfile(profileId);
        setProfileUser(profileRes.data.user);
        setAnalytics(profileRes.data.analytics);

        // 2. Get user's projects
        const projectsRes = await userService.getUserProjects(profileId);
        setProjects(projectsRes.data.projects);

        // 3. Get user's activity logs
        const activityRes = await userService.getUserActivity(profileId);
        setActivity(activityRes.data.activity);

        // Initialize edit form
        const userObj = profileRes.data.user;
        setEditFormData({
          name: userObj.name || "",
          bio: userObj.bio || "",
          skills: userObj.skills ? userObj.skills.join(", ") : "",
          college: userObj.college || "",
          branch: userObj.branch || "",
          year: userObj.year || "",
          location: userObj.location || "",
          portfolio: userObj.portfolio || "",
          leetcode: userObj.leetcode || "",
          codeforces: userObj.codeforces || "",
          website: userObj.website || "",
          github: userObj.github || "",
          linkedin: userObj.linkedin || "",
          preferredRoles: userObj.preferredRoles ? userObj.preferredRoles.join(", ") : "",
          interests: userObj.interests ? userObj.interests.join(", ") : "",
          availability: userObj.availability || "Available"
        });
        setAvatarPreview(userObj.profilePicture || "");
        setCoverPreview(userObj.coverImage || "");
      } catch (err) {
        setError(err.message || "Failed to load user profile.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [profileId, currentUser]);

  const handleEditChange = (e) => {
    setEditFormData({
      ...editFormData,
      [e.target.name]: e.target.value
    });
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      setEditLoading(true);
      setEditError("");

      // Parse array fields
      const skillsArray = editFormData.skills
        ? editFormData.skills.split(",").map((s) => s.trim()).filter(Boolean)
        : [];

      const preferredRolesArray = editFormData.preferredRoles
        ? editFormData.preferredRoles.split(",").map((r) => r.trim()).filter(Boolean)
        : [];

      const interestsArray = editFormData.interests
        ? editFormData.interests.split(",").map((i) => i.trim()).filter(Boolean)
        : [];

      // 1. Update text metadata fields
      const updateData = {
        ...editFormData,
        skills: skillsArray,
        preferredRoles: preferredRolesArray,
        interests: interestsArray
      };

      const metaRes = await userService.updateUserProfile(updateData);
      let updatedUserObj = metaRes.data.user;

      // 2. Upload avatar if selected
      if (avatarFile) {
        const avatarData = new FormData();
        avatarData.append("file", avatarFile);
        const avatarRes = await userService.updateAvatar(avatarData);
        updatedUserObj = avatarRes.data.user;
      }

      // 3. Upload cover image if selected
      if (coverFile) {
        const coverData = new FormData();
        coverData.append("file", coverFile);
        const coverRes = await userService.updateCover(coverData);
        updatedUserObj = coverRes.data.user;
      }

      setProfileUser(updatedUserObj);
      setEditOpen(false);
      setAvatarFile(null);
      setCoverFile(null);
    } catch (err) {
      setEditError(err.message || "Failed to update profile settings.");
    } finally {
      setEditLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-base flex flex-col items-center justify-center pt-20 space-y-3">
        <div className="w-10 h-10 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-xs font-semibold text-muted-text">Loading builder profile...</p>
      </div>
    );
  }

  if (error || !profileUser) {
    return (
      <div className="min-h-screen bg-bg-base flex flex-col items-center justify-center pt-20 text-center px-6">
        <span className="text-4xl mb-3">⚠️</span>
        <h2 className="text-2xl font-black text-primary-text mb-2">Profile Error</h2>
        <p className="text-muted-text text-sm max-w-md">{error || "User could not be found."}</p>
        <Link to="/" className="mt-6 px-5 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-btn text-xs font-bold transition-all shadow-subtle">
          Go Back Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-base text-primary-text pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* PROFILE HEADER PANEL */}
        <div className="bg-card-surface border border-border-slate rounded-card overflow-hidden shadow-card mb-8 relative">
          {/* Cover photo frame */}
          <div className="h-48 md:h-64 bg-[#EFE9DF] relative overflow-hidden group">
            {profileUser.coverImage ? (
              <img
                src={profileUser.coverImage}
                alt="Cover photo"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-[#F4EFE6] via-[#EFE9DF] to-[#E5DEC7] relative">
                <div
                  className="absolute inset-0 opacity-[0.08]"
                  style={{
                    backgroundImage: "radial-gradient(#292929 1px, transparent 1px)",
                    backgroundSize: "20px 20px",
                  }}
                />
              </div>
            )}
            {isMe && (
              <label className="absolute bottom-4 right-4 bg-white/90 hover:bg-white border border-border-slate px-3.5 py-1.5 rounded-btn text-xs font-bold text-primary-text cursor-pointer transition-colors shadow-subtle backdrop-blur-xs flex items-center gap-1.5">
                <span>✏️</span> Change Cover
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (file) {
                      try {
                        const data = new FormData();
                        data.append("file", file);
                        const res = await userService.updateCover(data);
                        setProfileUser(res.data.user);
                      } catch (err) {
                        alert(err.message || "Failed to upload cover.");
                      }
                    }
                  }}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Profile Basic Info block */}
          <div className="p-6 md:p-8 pt-0 relative flex flex-col md:flex-row md:items-end justify-between gap-6">
            {/* Avatar image overlap */}
            <div className="relative -mt-16 md:-mt-20 w-28 h-28 md:w-36 md:h-36 rounded-full border-4 border-white bg-card-surface overflow-hidden shrink-0 group shadow-modal">
              {profileUser.profilePicture ? (
                <img
                  src={profileUser.profilePicture}
                  alt={profileUser.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-primary/10 flex items-center justify-center font-black text-3xl md:text-4xl text-primary">
                  {profileUser.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                </div>
              )}
              {isMe && (
                <label className="absolute inset-0 bg-secondary-charcoal/70 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-[10px] font-bold text-white cursor-pointer transition-opacity duration-200">
                  <span className="text-base mb-0.5">📸</span>
                  <span>Upload</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files[0];
                      if (file) {
                        try {
                          const data = new FormData();
                          data.append("file", file);
                          const res = await userService.updateAvatar(data);
                          setProfileUser(res.data.user);
                        } catch (err) {
                          alert(err.message || "Failed to upload avatar.");
                        }
                      }
                    }}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Profile Meta Info description */}
            <div className="flex-1 space-y-2 min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl md:text-3xl font-black text-primary-text leading-tight tracking-tight">
                  {profileUser.name}
                </h1>

                {/* Availability Badge */}
                <span
                  className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold border ${
                    profileUser.availability === "Available"
                      ? "bg-success/10 border-success/30 text-success"
                      : "bg-warning/10 border-warning/30 text-warning"
                  }`}
                >
                  ● {profileUser.availability || "Available"}
                </span>
              </div>

              <p className="text-muted-text text-xs md:text-sm font-medium">
                🎓 {profileUser.college} • {profileUser.branch} ({profileUser.year})
              </p>

              {profileUser.location && (
                <p className="text-muted-text text-xs">
                  📍 {profileUser.location}
                </p>
              )}

              {profileUser.bio && (
                <p className="text-primary-text text-xs md:text-sm max-w-2xl leading-relaxed pt-1">
                  {profileUser.bio}
                </p>
              )}

              {/* Social links row */}
              <div className="flex flex-wrap items-center gap-3 pt-3 text-xs">
                {profileUser.github && (
                  <a
                    href={profileUser.github.startsWith("http") ? profileUser.github : `https://github.com/${profileUser.github}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-[#FAF7F2] hover:bg-[#F2ECE1] border border-border-slate font-bold text-primary-text transition flex items-center gap-1.5"
                  >
                    <span>🐙</span> GitHub
                  </a>
                )}
                {profileUser.linkedin && (
                  <a
                    href={profileUser.linkedin.startsWith("http") ? profileUser.linkedin : `https://linkedin.com/in/${profileUser.linkedin}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-[#FAF7F2] hover:bg-[#F2ECE1] border border-border-slate font-bold text-primary-text transition flex items-center gap-1.5"
                  >
                    <span>🔗</span> LinkedIn
                  </a>
                )}
                {profileUser.leetcode && (
                  <a
                    href={profileUser.leetcode.startsWith("http") ? profileUser.leetcode : `https://leetcode.com/${profileUser.leetcode}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-[#FAF7F2] hover:bg-[#F2ECE1] border border-border-slate font-bold text-primary-text transition flex items-center gap-1.5"
                  >
                    <span>💻</span> LeetCode
                  </a>
                )}
                {profileUser.codeforces && (
                  <a
                    href={profileUser.codeforces.startsWith("http") ? profileUser.codeforces : `https://codeforces.com/profile/${profileUser.codeforces}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-[#FAF7F2] hover:bg-[#F2ECE1] border border-border-slate font-bold text-primary-text transition flex items-center gap-1.5"
                  >
                    <span>📊</span> Codeforces
                  </a>
                )}
                {profileUser.website && (
                  <a
                    href={profileUser.website.startsWith("http") ? profileUser.website : `https://${profileUser.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-[#FAF7F2] hover:bg-[#F2ECE1] border border-border-slate font-bold text-primary-text transition flex items-center gap-1.5"
                  >
                    <span>🌐</span> Portfolio
                  </a>
                )}
              </div>
            </div>

            {/* Edit button */}
            {isMe && (
              <button
                onClick={() => setEditOpen(true)}
                className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-btn text-xs font-bold shadow-subtle transition-all shrink-0 cursor-pointer flex items-center gap-1.5 self-start md:self-end"
              >
                <span>✏️</span> Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* TAB CONTROLS NAVIGATION */}
        <div className="flex border-b border-border-slate mb-6 overflow-x-auto scrollbar-none gap-6">
          <button
            onClick={() => setActiveTab("overview")}
            className={`pb-3 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
              activeTab === "overview"
                ? "border-primary text-primary"
                : "border-transparent text-muted-text hover:text-primary-text"
            }`}
          >
            📊 Analytics & Skills
          </button>
          <button
            onClick={() => setActiveTab("projects")}
            className={`pb-3 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
              activeTab === "projects"
                ? "border-primary text-primary"
                : "border-transparent text-muted-text hover:text-primary-text"
            }`}
          >
            📁 Projects ({projects.length})
          </button>
          <button
            onClick={() => setActiveTab("activity")}
            className={`pb-3 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
              activeTab === "activity"
                ? "border-primary text-primary"
                : "border-transparent text-muted-text hover:text-primary-text"
            }`}
          >
            ⏰ Recent Activity
          </button>
        </div>

        {/* TAB CONTENTS PANEL */}
        <div>
          {/* TAB 1: ANALYTICS & SKILLS */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Analytics Summary */}
              <div className="lg:col-span-8 space-y-4">
                <h3 className="text-muted-text text-xs font-bold uppercase tracking-wider">Profile Analytics</h3>

                {analytics ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="bg-card-surface border border-border-slate p-4 rounded-card shadow-subtle hover:border-primary/40 transition-colors">
                      <span className="text-[10px] text-muted-text block uppercase font-bold tracking-wider">Projects Created</span>
                      <span className="text-2xl font-black text-primary-text block mt-1">{analytics.projectsCreated}</span>
                    </div>
                    <div className="bg-card-surface border border-border-slate p-4 rounded-card shadow-subtle hover:border-primary/40 transition-colors">
                      <span className="text-[10px] text-muted-text block uppercase font-bold tracking-wider">Projects Joined</span>
                      <span className="text-2xl font-black text-primary-text block mt-1">{analytics.projectsJoined}</span>
                    </div>
                    <div className="bg-card-surface border border-border-slate p-4 rounded-card shadow-subtle hover:border-primary/40 transition-colors">
                      <span className="text-[10px] text-muted-text block uppercase font-bold tracking-wider">Tasks Completed</span>
                      <span className="text-2xl font-black text-primary-text block mt-1">{analytics.tasksCompleted}</span>
                    </div>
                    <div className="bg-card-surface border border-border-slate p-4 rounded-card shadow-subtle hover:border-primary/40 transition-colors">
                      <span className="text-[10px] text-muted-text block uppercase font-bold tracking-wider">Documents Uploaded</span>
                      <span className="text-2xl font-black text-primary-text block mt-1">{analytics.documentsUploaded}</span>
                    </div>

                    {/* Private Analytics only visible to owner */}
                    {isMe && (
                      <>
                        <div className="bg-card-surface border border-border-slate p-4 rounded-card shadow-subtle hover:border-primary/40 transition-colors">
                          <span className="text-[10px] text-muted-text block uppercase font-bold tracking-wider">Alerts Received</span>
                          <span className="text-2xl font-black text-primary-text block mt-1">{analytics.notificationsReceived}</span>
                        </div>
                        <div className="bg-card-surface border border-border-slate p-4 rounded-card shadow-subtle hover:border-primary/40 transition-colors">
                          <span className="text-[10px] text-muted-text block uppercase font-bold tracking-wider">AI Copilot Queries</span>
                          <span className="text-2xl font-black text-primary-text block mt-1">{analytics.aiRequests}</span>
                        </div>
                      </>
                    )}

                    <div className="bg-card-surface border border-border-slate p-4 rounded-card shadow-subtle hover:border-primary/40 transition-colors">
                      <span className="text-[10px] text-muted-text block uppercase font-bold tracking-wider">GitHub Connected</span>
                      <span className={`text-sm font-bold block mt-2 ${analytics.githubConnected ? "text-success" : "text-muted-text"}`}>
                        {analytics.githubConnected ? "✓ Connected" : "Not Connected"}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-text text-xs">No analytics available.</p>
                )}
              </div>

              {/* Skills and interests sidebar */}
              <div className="lg:col-span-4 space-y-6">
                {/* Skills */}
                <div className="bg-card-surface border border-border-slate p-5 rounded-card space-y-3.5 shadow-subtle">
                  <h3 className="text-muted-text text-xs font-bold uppercase tracking-wider">Verified Skillsets</h3>
                  {profileUser.skills && profileUser.skills.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {profileUser.skills.map((skill) => (
                        <span
                          key={skill}
                          className="px-2.5 py-1 bg-[#FAF7F2] border border-border-slate text-xs rounded-lg font-bold text-primary-text"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-text text-xs leading-normal">No skills listed yet.</p>
                  )}
                </div>

                {/* Preferred roles */}
                {profileUser.preferredRoles && profileUser.preferredRoles.length > 0 && (
                  <div className="bg-card-surface border border-border-slate p-5 rounded-card space-y-3.5 shadow-subtle">
                    <h3 className="text-muted-text text-xs font-bold uppercase tracking-wider">Preferred Roles</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {profileUser.preferredRoles.map((role) => (
                        <span key={role} className="px-2.5 py-1 bg-primary/10 border border-primary/20 text-xs rounded-lg font-bold text-primary">
                          {role}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: PROJECTS GRID */}
          {activeTab === "projects" && (
            <div className="space-y-4">
              <h3 className="text-muted-text text-xs font-bold uppercase tracking-wider">Associated Projects</h3>

              {projects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {projects.map((proj) => (
                    <div
                      key={proj._id}
                      className="bg-card-surface border border-border-slate p-5 rounded-card shadow-subtle hover:border-primary/50 transition-colors flex flex-col justify-between"
                    >
                      <div className="space-y-2.5">
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="font-bold text-primary-text text-base hover:text-primary transition-colors">
                            <Link to={`/projects/${proj._id}`}>{proj.title}</Link>
                          </h4>
                          <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold border tracking-wider ${
                            proj.status === "open"
                              ? "bg-success/10 border-success/30 text-success"
                              : "bg-[#FAF7F2] border-border-slate text-muted-text"
                          }`}>
                            {proj.status}
                          </span>
                        </div>

                        <p className="text-muted-text text-xs line-clamp-3 leading-relaxed">
                          {proj.description}
                        </p>

                        <div className="flex flex-wrap gap-1 pt-1">
                          {proj.skillsRequired?.slice(0, 3).map((skill) => (
                            <span key={skill} className="px-1.5 py-0.5 bg-[#FAF7F2] border border-border-slate text-[10px] rounded font-semibold text-primary-text">
                              {skill}
                            </span>
                          ))}
                          {proj.skillsRequired?.length > 3 && (
                            <span className="text-[10px] text-muted-text self-center">+{proj.skillsRequired.length - 3} more</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-border-slate/60 pt-3.5 mt-4 text-xs">
                        <span className="text-muted-text">
                          Role: <strong className="text-primary-text">
                            {proj.creator?._id?.toString() === profileUser._id?.toString() ? "Project Creator" : "Teammate"}
                          </strong>
                        </span>
                        {proj.githubUrl && (
                          <a href={proj.githubUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary-hover font-bold flex items-center gap-1">
                            🐙 Repo ↗
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-card-surface border border-border-slate rounded-card p-12 text-center text-muted-text">
                  <span className="text-3xl block mb-2">📁</span>
                  <p className="text-xs font-semibold">No active project associations found for this user.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: RECENT ACTIVITY */}
          {activeTab === "activity" && (
            <div className="space-y-4">
              <h3 className="text-muted-text text-xs font-bold uppercase tracking-wider">Recent Activity Logs</h3>

              {activity.length > 0 ? (
                <div className="relative border-l border-border-slate pl-6 ml-3 space-y-4">
                  {activity.map((act) => (
                    <div key={act._id} className="relative">
                      <span className="absolute -left-[31px] top-3.5 w-2.5 h-2.5 rounded-full bg-primary" />
                      <div className="bg-card-surface border border-border-slate p-4 rounded-card shadow-subtle">
                        <p className="text-xs text-primary-text">
                          <strong className="text-primary font-bold">{profileUser.name}</strong> {act.action} <span className="font-semibold text-secondary-charcoal">"{act.target}"</span>
                        </p>
                        <p className="text-[10px] text-muted-text mt-1">
                          Workspace: {act.project?.title || "Project Workspace"} • {new Date(act.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-card-surface border border-border-slate rounded-card p-12 text-center text-muted-text">
                  <span className="text-3xl block mb-2">⏰</span>
                  <p className="text-xs font-semibold">No recent activity logs recorded for this user.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* EDIT PROFILE MODAL */}
      <AnimatePresence>
        {editOpen && (
          <div className="fixed inset-0 bg-secondary-charcoal/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 sm:p-6 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card-surface border border-border-slate w-full max-w-2xl rounded-card p-6 md:p-8 space-y-5 my-8 shadow-modal"
            >
              <div className="flex justify-between items-center border-b border-border-slate pb-3">
                <h3 className="text-lg font-black text-primary-text tracking-tight">Edit Profile & Portfolio</h3>
                <button
                  onClick={() => setEditOpen(false)}
                  className="w-7 h-7 rounded-full bg-[#FAF7F2] border border-border-slate flex items-center justify-center text-xs text-muted-text hover:text-primary-text transition cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {editError && (
                <div className="p-3 bg-danger/10 border border-danger/20 text-danger text-xs rounded-input font-semibold">
                  {editError}
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="space-y-4">
                {/* Images Preview Section */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#FAF7F2] p-4 rounded-card border border-border-slate">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-text uppercase tracking-wider block">Avatar Picture</label>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full overflow-hidden border border-border-slate bg-white shrink-0">
                        {avatarPreview ? (
                          <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold text-xs text-primary">TF</div>
                        )}
                      </div>
                      <label className="px-3 py-1.5 bg-white hover:bg-[#F2ECE1] border border-border-slate rounded-btn text-xs text-primary-text cursor-pointer font-bold transition-colors shadow-subtle">
                        Select Avatar
                        <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                      </label>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-text uppercase tracking-wider block">Cover Photo</label>
                    <div className="flex items-center gap-3">
                      <div className="w-20 h-10 rounded-lg border border-border-slate bg-white overflow-hidden shrink-0">
                        {coverPreview && (
                          <img src={coverPreview} alt="Preview" className="w-full h-full object-cover" />
                        )}
                      </div>
                      <label className="px-3 py-1.5 bg-white hover:bg-[#F2ECE1] border border-border-slate rounded-btn text-xs text-primary-text cursor-pointer font-bold transition-colors shadow-subtle">
                        Select Cover
                        <input type="file" accept="image/*" onChange={handleCoverChange} className="hidden" />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Grid Inputs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-primary-text">Full Name</label>
                    <input
                      type="text"
                      name="name"
                      value={editFormData.name}
                      onChange={handleEditChange}
                      required
                      className="w-full bg-[#FAF7F2] border border-border-slate rounded-input px-3 py-2 text-primary-text text-xs outline-none focus:border-primary focus:bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-primary-text">College Name</label>
                    <input
                      type="text"
                      name="college"
                      value={editFormData.college}
                      onChange={handleEditChange}
                      required
                      className="w-full bg-[#FAF7F2] border border-border-slate rounded-input px-3 py-2 text-primary-text text-xs outline-none focus:border-primary focus:bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-primary-text">Branch / Field</label>
                    <input
                      type="text"
                      name="branch"
                      value={editFormData.branch}
                      onChange={handleEditChange}
                      required
                      className="w-full bg-[#FAF7F2] border border-border-slate rounded-input px-3 py-2 text-primary-text text-xs outline-none focus:border-primary focus:bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-primary-text">Academic Year</label>
                    <input
                      type="text"
                      name="year"
                      value={editFormData.year}
                      onChange={handleEditChange}
                      required
                      placeholder="e.g. 3rd Year"
                      className="w-full bg-[#FAF7F2] border border-border-slate rounded-input px-3 py-2 text-primary-text text-xs outline-none focus:border-primary focus:bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-primary-text">Location</label>
                    <input
                      type="text"
                      name="location"
                      value={editFormData.location}
                      onChange={handleEditChange}
                      placeholder="e.g. New Delhi, India"
                      className="w-full bg-[#FAF7F2] border border-border-slate rounded-input px-3 py-2 text-primary-text text-xs outline-none focus:border-primary focus:bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-primary-text">Availability</label>
                    <select
                      name="availability"
                      value={editFormData.availability}
                      onChange={handleEditChange}
                      className="w-full bg-[#FAF7F2] border border-border-slate rounded-input px-3 py-2 text-primary-text text-xs outline-none focus:border-primary focus:bg-white font-medium"
                    >
                      <option value="Available">Available</option>
                      <option value="Busy">Busy</option>
                    </select>
                  </div>
                </div>

                {/* Comma-separated Inputs */}
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-primary-text">Bio</label>
                    <textarea
                      name="bio"
                      value={editFormData.bio}
                      onChange={handleEditChange}
                      rows={2}
                      className="w-full bg-[#FAF7F2] border border-border-slate rounded-input px-3 py-2 text-primary-text text-xs outline-none focus:border-primary focus:bg-white resize-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-primary-text">Skills (comma-separated)</label>
                    <input
                      type="text"
                      name="skills"
                      value={editFormData.skills}
                      onChange={handleEditChange}
                      placeholder="e.g. React, Node.js, Python, Figma"
                      className="w-full bg-[#FAF7F2] border border-border-slate rounded-input px-3 py-2 text-primary-text text-xs outline-none focus:border-primary focus:bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-primary-text">Preferred Roles (comma-separated)</label>
                    <input
                      type="text"
                      name="preferredRoles"
                      value={editFormData.preferredRoles}
                      onChange={handleEditChange}
                      placeholder="e.g. Fullstack Lead, UI Designer"
                      className="w-full bg-[#FAF7F2] border border-border-slate rounded-input px-3 py-2 text-primary-text text-xs outline-none focus:border-primary focus:bg-white"
                    />
                  </div>
                </div>

                {/* Socials / External links */}
                <div className="space-y-2 pt-1">
                  <h4 className="text-xs font-bold text-muted-text uppercase tracking-wider">Social Links & Profiles</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      type="text"
                      name="github"
                      value={editFormData.github}
                      onChange={handleEditChange}
                      placeholder="GitHub Username"
                      className="w-full bg-[#FAF7F2] border border-border-slate rounded-input px-3 py-2 text-primary-text text-xs outline-none focus:border-primary focus:bg-white"
                    />
                    <input
                      type="text"
                      name="linkedin"
                      value={editFormData.linkedin}
                      onChange={handleEditChange}
                      placeholder="LinkedIn Username"
                      className="w-full bg-[#FAF7F2] border border-border-slate rounded-input px-3 py-2 text-primary-text text-xs outline-none focus:border-primary focus:bg-white"
                    />
                    <input
                      type="text"
                      name="leetcode"
                      value={editFormData.leetcode}
                      onChange={handleEditChange}
                      placeholder="LeetCode Username"
                      className="w-full bg-[#FAF7F2] border border-border-slate rounded-input px-3 py-2 text-primary-text text-xs outline-none focus:border-primary focus:bg-white"
                    />
                    <input
                      type="text"
                      name="codeforces"
                      value={editFormData.codeforces}
                      onChange={handleEditChange}
                      placeholder="Codeforces Username"
                      className="w-full bg-[#FAF7F2] border border-border-slate rounded-input px-3 py-2 text-primary-text text-xs outline-none focus:border-primary focus:bg-white"
                    />
                    <input
                      type="text"
                      name="website"
                      value={editFormData.website}
                      onChange={handleEditChange}
                      placeholder="Personal Website / Portfolio URL"
                      className="w-full bg-[#FAF7F2] border border-border-slate rounded-input px-3 py-2 text-primary-text text-xs outline-none focus:border-primary focus:bg-white col-span-1 md:col-span-2"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-border-slate">
                  <button
                    type="button"
                    onClick={() => setEditOpen(false)}
                    className="px-5 py-2.5 bg-transparent border border-border-slate text-muted-text hover:text-primary-text hover:bg-[#FAF7F2] rounded-btn text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editLoading}
                    className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-btn text-xs font-bold shadow-subtle cursor-pointer disabled:opacity-60 flex items-center justify-center transition-all"
                  >
                    {editLoading ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Profile;
