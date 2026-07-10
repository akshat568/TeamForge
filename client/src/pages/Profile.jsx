import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import userService from "../services/userService";

const Profile = () => {
  const { id } = useParams();
  const { user: currentUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // If no ID is provided in url, we are viewing our own profile
  const profileId = id || (currentUser ? currentUser.id : null);

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

  const isMe = currentUser && profileId && currentUser.id === profileId;

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
        ? editFormData.skills.split(",").map(s => s.trim()).filter(Boolean)
        : [];
      
      const preferredRolesArray = editFormData.preferredRoles
        ? editFormData.preferredRoles.split(",").map(r => r.trim()).filter(Boolean)
        : [];

      const interestsArray = editFormData.interests
        ? editFormData.interests.split(",").map(i => i.trim()).filter(Boolean)
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
      <div className="min-h-screen bg-bg-base flex items-center justify-center pt-20">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !profileUser) {
    return (
      <div className="min-h-screen bg-bg-base flex flex-col items-center justify-center pt-20 text-center px-6">
        <span className="text-4xl mb-4">⚠️</span>
        <h2 className="text-2xl font-bold text-white mb-2">Profile Error</h2>
        <p className="text-gray-400 text-sm max-w-md">{error || "User could not be found."}</p>
        <Link to="/" className="mt-6 px-5 py-2 bg-primary hover:bg-primary-hover text-white rounded text-sm font-semibold transition-colors">
          Go Back Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-base text-white pt-20 pb-16">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* PROFILE HEADER PANEL */}
        <div className="bg-bg-secondary border border-border-slate rounded-card overflow-hidden shadow-subtle mb-8 relative">
          
          {/* Cover photo frame */}
          <div className="h-48 md:h-64 bg-slate-800 relative overflow-hidden group">
            {profileUser.coverImage ? (
              <img
                src={profileUser.coverImage}
                alt="Cover photo"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-bg-base to-slate-800" />
            )}
            {isMe && (
              <label className="absolute bottom-4 right-4 bg-bg-base/80 hover:bg-bg-base border border-border-slate px-4 py-2 rounded text-xs font-bold text-gray-300 hover:text-white cursor-pointer transition-colors backdrop-blur">
                ✏️ Change Cover
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
            <div className="relative -mt-20 md:-mt-24 w-32 h-32 md:w-36 md:h-36 rounded-full border-4 border-bg-secondary bg-bg-secondary overflow-hidden shrink-0 group shadow-premium">
              {profileUser.profilePicture ? (
                <img
                  src={profileUser.profilePicture}
                  alt="Profile picture"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-primary/20 flex items-center justify-center font-black text-3xl text-primary-light">
                  {profileUser.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                </div>
              )}
              {isMe && (
                <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-[10px] font-bold text-white cursor-pointer transition-opacity duration-200">
                  <span>📸 Upload</span>
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
            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl md:text-3xl font-black text-white leading-tight">
                  {profileUser.name}
                </h1>
                
                {/* Availability Badge */}
                <span className={`px-2.5 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold border ${
                  profileUser.availability === "Available"
                    ? "bg-success/10 border-success/30 text-success"
                    : "bg-warning/10 border-warning/30 text-warning"
                }`}>
                  {profileUser.availability || "Available"}
                </span>
              </div>
              
              <p className="text-gray-400 text-sm">
                🎓 {profileUser.college} • {profileUser.branch} ({profileUser.year})
              </p>
              
              {profileUser.location && (
                <p className="text-gray-500 text-xs">
                  📍 {profileUser.location}
                </p>
              )}

              {profileUser.bio && (
                <p className="text-gray-300 text-sm max-w-2xl leading-relaxed mt-2">
                  {profileUser.bio}
                </p>
              )}

              {/* Social links row */}
              <div className="flex flex-wrap items-center gap-4 pt-3 text-gray-400">
                {profileUser.github && (
                  <a href={`https://github.com/${profileUser.github}`} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors" title="GitHub">
                    🐙 GitHub
                  </a>
                )}
                {profileUser.linkedin && (
                  <a href={`https://linkedin.com/in/${profileUser.linkedin}`} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors" title="LinkedIn">
                    🔗 LinkedIn
                  </a>
                )}
                {profileUser.leetcode && (
                  <a href={`https://leetcode.com/${profileUser.leetcode}`} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors" title="LeetCode">
                    💻 LeetCode
                  </a>
                )}
                {profileUser.codeforces && (
                  <a href={`https://codeforces.com/profile/${profileUser.codeforces}`} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors" title="Codeforces">
                    📊 Codeforces
                  </a>
                )}
                {profileUser.website && (
                  <a href={profileUser.website} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors" title="Website">
                    🌐 Website
                  </a>
                )}
              </div>
            </div>

            {/* Edit button */}
            {isMe && (
              <button
                onClick={() => setEditOpen(true)}
                className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-btn text-xs font-bold shadow-subtle transition-colors shrink-0 cursor-pointer"
              >
                ✏️ Edit Profile
              </button>
            )}

          </div>

        </div>

        {/* TAB CONTROLS NAVIGATION */}
        <div className="flex border-b border-border-slate/60 mb-6 overflow-x-auto scrollbar-none gap-6">
          <button
            onClick={() => setActiveTab("overview")}
            className={`pb-3 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
              activeTab === "overview"
                ? "border-primary text-primary-light"
                : "border-transparent text-gray-500 hover:text-gray-300"
            }`}
          >
            📊 Analytics & Skills
          </button>
          <button
            onClick={() => setActiveTab("projects")}
            className={`pb-3 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
              activeTab === "projects"
                ? "border-primary text-primary-light"
                : "border-transparent text-gray-500 hover:text-gray-300"
            }`}
          >
            📁 Projects ({projects.length})
          </button>
          <button
            onClick={() => setActiveTab("activity")}
            className={`pb-3 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
              activeTab === "activity"
                ? "border-primary text-primary-light"
                : "border-transparent text-gray-500 hover:text-gray-300"
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
              <div className="lg:col-span-8 space-y-6">
                <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider">Profile Analytics</h3>
                
                {analytics ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-bg-secondary border border-border-slate p-5 rounded-card">
                      <span className="text-[10px] text-gray-500 block uppercase font-bold tracking-wider">Projects Created</span>
                      <span className="text-2xl font-bold text-white block mt-1">{analytics.projectsCreated}</span>
                    </div>
                    <div className="bg-bg-secondary border border-border-slate p-5 rounded-card">
                      <span className="text-[10px] text-gray-500 block uppercase font-bold tracking-wider">Projects Joined</span>
                      <span className="text-2xl font-bold text-white block mt-1">{analytics.projectsJoined}</span>
                    </div>
                    <div className="bg-bg-secondary border border-border-slate p-5 rounded-card">
                      <span className="text-[10px] text-gray-500 block uppercase font-bold tracking-wider">Tasks Completed</span>
                      <span className="text-2xl font-bold text-white block mt-1">{analytics.tasksCompleted}</span>
                    </div>
                    <div className="bg-bg-secondary border border-border-slate p-5 rounded-card">
                      <span className="text-[10px] text-gray-500 block uppercase font-bold tracking-wider">Documents Uploaded</span>
                      <span className="text-2xl font-bold text-white block mt-1">{analytics.documentsUploaded}</span>
                    </div>
                    
                    {/* Private Analytics only visible to owner */}
                    {isMe && (
                      <>
                        <div className="bg-bg-secondary border border-border-slate p-5 rounded-card">
                          <span className="text-[10px] text-gray-500 block uppercase font-bold tracking-wider">Alerts Received</span>
                          <span className="text-2xl font-bold text-white block mt-1">{analytics.notificationsReceived}</span>
                        </div>
                        <div className="bg-bg-secondary border border-border-slate p-5 rounded-card">
                          <span className="text-[10px] text-gray-500 block uppercase font-bold tracking-wider">AI Queries</span>
                          <span className="text-2xl font-bold text-white block mt-1">{analytics.aiRequests}</span>
                        </div>
                      </>
                    )}

                    <div className="bg-bg-secondary border border-border-slate p-5 rounded-card">
                      <span className="text-[10px] text-gray-500 block uppercase font-bold tracking-wider">GitHub Connected</span>
                      <span className={`text-base font-bold block mt-2 ${analytics.githubConnected ? "text-success" : "text-gray-500"}`}>
                        {analytics.githubConnected ? "✓ Connected" : "Not Connected"}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-xs">No analytics available.</p>
                )}
              </div>

              {/* Skills and interests sidebar */}
              <div className="lg:col-span-4 space-y-6">
                
                {/* Skills */}
                <div className="bg-bg-secondary border border-border-slate p-6 rounded-card space-y-4">
                  <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider">Verified Skillsets</h3>
                  {profileUser.skills && profileUser.skills.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {profileUser.skills.map(skill => (
                        <span
                          key={skill}
                          className="px-2.5 py-1 bg-bg-base border border-border-slate/60 text-xs rounded font-medium text-gray-300"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-xs leading-normal">No skills listed yet.</p>
                  )}
                </div>

                {/* Preferred roles */}
                {profileUser.preferredRoles && profileUser.preferredRoles.length > 0 && (
                  <div className="bg-bg-secondary border border-border-slate p-6 rounded-card space-y-4">
                    <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider">Preferred Roles</h3>
                    <div className="flex flex-wrap gap-2">
                      {profileUser.preferredRoles.map(role => (
                        <span key={role} className="px-2.5 py-1 bg-primary/10 border border-primary/20 text-xs rounded font-medium text-primary-light">
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
            <div className="space-y-6">
              <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider">Associated Projects</h3>
              
              {projects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {projects.map((proj) => (
                    <div
                      key={proj._id}
                      className="bg-bg-secondary border border-border-slate p-6 rounded-card shadow-subtle hover:border-primary/50 transition-colors flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="font-bold text-white text-base hover:text-primary-light transition-colors">
                            <Link to={`/projects/${proj._id}`}>{proj.title}</Link>
                          </h4>
                          <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold border tracking-wider ${
                            proj.status === "open"
                              ? "bg-success/10 border-success/30 text-success"
                              : "bg-gray-500/10 border-gray-500/30 text-gray-400"
                          }`}>
                            {proj.status}
                          </span>
                        </div>
                        
                        <p className="text-gray-400 text-xs line-clamp-3 leading-relaxed">
                          {proj.description}
                        </p>

                        <div className="flex flex-wrap gap-1 pt-1">
                          {proj.skillsRequired.slice(0, 3).map(skill => (
                            <span key={skill} className="px-1.5 py-0.5 bg-bg-base border border-border-slate/60 text-[9px] rounded font-medium text-gray-300">
                              {skill}
                            </span>
                          ))}
                          {proj.skillsRequired.length > 3 && (
                            <span className="text-[9px] text-gray-500 self-center">+{proj.skillsRequired.length - 3} more</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-border-slate/40 pt-4 mt-4 text-xs">
                        <span className="text-gray-500">
                          Role: <strong className="text-white">
                            {proj.creator._id.toString() === profileUser._id.toString() ? "Project Creator" : "Teammate"}
                          </strong>
                        </span>
                        {proj.githubUrl && (
                          <a href={proj.githubUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary-hover font-bold">
                            🐙 Code base
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-bg-secondary border border-border-slate rounded-card p-12 text-center text-gray-500">
                  <span className="text-3xl block mb-2">📁</span>
                  <p className="text-xs">No active project associations found for this user.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: RECENT ACTIVITY */}
          {activeTab === "activity" && (
            <div className="space-y-6">
              <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider">Recent Activity Logs</h3>
              
              {activity.length > 0 ? (
                <div className="relative border-l border-border-slate pl-6 ml-3 space-y-6">
                  {activity.map((act) => (
                    <div key={act._id} className="relative">
                      <span className="absolute -left-[31px] top-1.5 w-2 h-2 rounded-full bg-primary" />
                      <div className="bg-bg-secondary border border-border-slate p-4 rounded-card">
                        <p className="text-xs text-white">
                          <strong className="text-primary-light">{profileUser.name}</strong> {act.action} <span className="text-gray-300">"{act.target}"</span>
                        </p>
                        <p className="text-[10px] text-gray-500 mt-1">
                          Workspace: {act.project?.title || "Project Workspace"} • {new Date(act.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-bg-secondary border border-border-slate rounded-card p-12 text-center text-gray-500">
                  <span className="text-3xl block mb-2">⏰</span>
                  <p className="text-xs">No recent activity logs recorded for this user.</p>
                </div>
              )}
            </div>
          )}

        </div>

      </div>

      {/* EDIT PROFILE MODAL */}
      <AnimatePresence>
        {editOpen && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-6 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-bg-secondary border border-border-slate w-full max-w-2xl rounded-modal p-6 md:p-8 space-y-6 my-8 shadow-premium"
            >
              <div className="flex justify-between items-center border-b border-border-slate/60 pb-3">
                <h3 className="text-xl font-bold text-white">Edit Profile Portfolio</h3>
                <button
                  onClick={() => setEditOpen(false)}
                  className="text-gray-400 hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {editError && (
                <div className="p-3 bg-danger/10 border border-danger/20 text-danger text-xs rounded">
                  {editError}
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="space-y-6">
                
                {/* Images Preview Section */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-400 block">Avatar Picture</label>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full overflow-hidden border border-border-slate bg-bg-base flex-shrink-0">
                        {avatarPreview ? (
                          <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold text-xs">TF</div>
                        )}
                      </div>
                      <label className="px-3 py-1.5 bg-bg-base hover:bg-hover-surface border border-border-slate rounded text-xs text-gray-300 hover:text-white cursor-pointer font-bold transition-colors">
                        Select Avatar
                        <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                      </label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-400 block">Cover Photo</label>
                    <div className="flex items-center gap-3">
                      <div className="w-20 h-10 rounded border border-border-slate bg-bg-base overflow-hidden flex-shrink-0">
                        {coverPreview && (
                          <img src={coverPreview} alt="Preview" className="w-full h-full object-cover" />
                        )}
                      </div>
                      <label className="px-3 py-1.5 bg-bg-base hover:bg-hover-surface border border-border-slate rounded text-xs text-gray-300 hover:text-white cursor-pointer font-bold transition-colors">
                        Select Cover
                        <input type="file" accept="image/*" onChange={handleCoverChange} className="hidden" />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Grid Inputs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-300">Name</label>
                    <input
                      type="text"
                      name="name"
                      value={editFormData.name}
                      onChange={handleEditChange}
                      required
                      className="w-full bg-card-surface border border-border-slate rounded-input px-3 py-2 text-white text-xs outline-none focus:border-primary placeholder:text-gray-500"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-300">College Name</label>
                    <input
                      type="text"
                      name="college"
                      value={editFormData.college}
                      onChange={handleEditChange}
                      required
                      className="w-full bg-card-surface border border-border-slate rounded-input px-3 py-2 text-white text-xs outline-none focus:border-primary"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-300">Branch / Field</label>
                    <input
                      type="text"
                      name="branch"
                      value={editFormData.branch}
                      onChange={handleEditChange}
                      required
                      className="w-full bg-card-surface border border-border-slate rounded-input px-3 py-2 text-white text-xs outline-none focus:border-primary"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-300">Academic Year</label>
                    <input
                      type="text"
                      name="year"
                      value={editFormData.year}
                      onChange={handleEditChange}
                      required
                      placeholder="e.g. 3rd Year"
                      className="w-full bg-card-surface border border-border-slate rounded-input px-3 py-2 text-white text-xs outline-none focus:border-primary"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-300">Location</label>
                    <input
                      type="text"
                      name="location"
                      value={editFormData.location}
                      onChange={handleEditChange}
                      placeholder="e.g. India"
                      className="w-full bg-card-surface border border-border-slate rounded-input px-3 py-2 text-white text-xs outline-none focus:border-primary"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-300">Availability</label>
                    <select
                      name="availability"
                      value={editFormData.availability}
                      onChange={handleEditChange}
                      className="w-full bg-card-surface border border-border-slate rounded-input px-3 py-2 text-white text-xs outline-none focus:border-primary"
                    >
                      <option value="Available">Available</option>
                      <option value="Busy">Busy</option>
                    </select>
                  </div>
                </div>

                {/* Comma-separated Inputs */}
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-300">Bio</label>
                    <textarea
                      name="bio"
                      value={editFormData.bio}
                      onChange={handleEditChange}
                      rows={2}
                      className="w-full bg-card-surface border border-border-slate rounded-input px-3 py-2 text-white text-xs outline-none focus:border-primary resize-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-300">Skills (comma-separated)</label>
                    <input
                      type="text"
                      name="skills"
                      value={editFormData.skills}
                      onChange={handleEditChange}
                      placeholder="e.g. React, Node.js, Python"
                      className="w-full bg-card-surface border border-border-slate rounded-input px-3 py-2 text-white text-xs outline-none focus:border-primary"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-300">Preferred Roles (comma-separated)</label>
                    <input
                      type="text"
                      name="preferredRoles"
                      value={editFormData.preferredRoles}
                      onChange={handleEditChange}
                      placeholder="e.g. Frontend Dev, Backend Lead"
                      className="w-full bg-card-surface border border-border-slate rounded-input px-3 py-2 text-white text-xs outline-none focus:border-primary"
                    />
                  </div>
                </div>

                {/* Socials / External links */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Social Links</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      name="github"
                      value={editFormData.github}
                      onChange={handleEditChange}
                      placeholder="GitHub Username"
                      className="w-full bg-card-surface border border-border-slate rounded-input px-3 py-2 text-white text-xs outline-none focus:border-primary"
                    />
                    <input
                      type="text"
                      name="linkedin"
                      value={editFormData.linkedin}
                      onChange={handleEditChange}
                      placeholder="LinkedIn Username"
                      className="w-full bg-card-surface border border-border-slate rounded-input px-3 py-2 text-white text-xs outline-none focus:border-primary"
                    />
                    <input
                      type="text"
                      name="leetcode"
                      value={editFormData.leetcode}
                      onChange={handleEditChange}
                      placeholder="LeetCode Username"
                      className="w-full bg-card-surface border border-border-slate rounded-input px-3 py-2 text-white text-xs outline-none focus:border-primary"
                    />
                    <input
                      type="text"
                      name="codeforces"
                      value={editFormData.codeforces}
                      onChange={handleEditChange}
                      placeholder="Codeforces Username"
                      className="w-full bg-card-surface border border-border-slate rounded-input px-3 py-2 text-white text-xs outline-none focus:border-primary"
                    />
                    <input
                      type="text"
                      name="website"
                      value={editFormData.website}
                      onChange={handleEditChange}
                      placeholder="Personal Website URL"
                      className="w-full bg-card-surface border border-border-slate rounded-input px-3 py-2 text-white text-xs outline-none focus:border-primary col-span-1 md:col-span-2"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-border-slate/60">
                  <button
                    type="button"
                    onClick={() => setEditOpen(false)}
                    className="px-5 py-2.5 bg-transparent border border-border-slate text-gray-300 hover:text-white rounded text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editLoading}
                    className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white rounded text-xs font-bold shadow-subtle cursor-pointer disabled:opacity-60 flex items-center justify-center"
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
