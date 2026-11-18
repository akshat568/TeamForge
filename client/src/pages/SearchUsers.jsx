import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import userService from "../services/userService";
import { useAuth } from "../context/AuthContext";

const SearchUsers = () => {
  const { user: currentUser } = useAuth();
  const [queryParams, setQueryParams] = useState({
    name: "",
    college: "",
    skills: "",
    branch: ""
  });
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchUsers = async (params = queryParams) => {
    try {
      setLoading(true);
      setError("");
      const res = await userService.searchUsers(params);
      if (res.data.success) {
        setUsers(res.data.users);
      }
    } catch (err) {
      setError(err.message || "Failed to search student developers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers({ name: "", college: "", skills: "", branch: "" });
  }, []);

  const handleChange = (e) => {
    setQueryParams({
      ...queryParams,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleClear = () => {
    const cleared = { name: "", college: "", skills: "", branch: "" };
    setQueryParams(cleared);
    fetchUsers(cleared);
  };

  return (
    <div className="min-h-screen bg-bg-base text-text-primary pt-28 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* HEADER */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-primary bg-primary-tint px-3 py-1 rounded-full border border-primary/20">
            Student Directory
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-charcoal tracking-tight">
            Find <span className="text-primary">Teammates</span>
          </h1>
          <p className="text-text-muted text-sm md:text-base leading-relaxed">
            Connect with verified student builders, designers, and project leads across colleges for hackathons and startups.
          </p>
        </div>

        {/* SEARCH FORM */}
        <form onSubmit={handleSubmit} className="bg-card-surface border border-border-slate rounded-card p-6 md:p-8 shadow-subtle space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Student Name</label>
              <input
                type="text"
                name="name"
                value={queryParams.name}
                onChange={handleChange}
                placeholder="e.g. Alex Chen"
                className="w-full bg-[#F8F5EF] border border-border-slate focus:border-primary focus:bg-white rounded-input px-3.5 py-2.5 text-charcoal text-sm outline-none transition-colors placeholder:text-text-muted"
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted">College / University</label>
              <input
                type="text"
                name="college"
                value={queryParams.college}
                onChange={handleChange}
                placeholder="e.g. Stanford, MIT, VIT"
                className="w-full bg-[#F8F5EF] border border-border-slate focus:border-primary focus:bg-white rounded-input px-3.5 py-2.5 text-charcoal text-sm outline-none transition-colors placeholder:text-text-muted"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Skills & Tech Stack</label>
              <input
                type="text"
                name="skills"
                value={queryParams.skills}
                onChange={handleChange}
                placeholder="e.g. React, Python, Figma"
                className="w-full bg-[#F8F5EF] border border-border-slate focus:border-primary focus:bg-white rounded-input px-3.5 py-2.5 text-charcoal text-sm outline-none transition-colors placeholder:text-text-muted"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Branch / Field</label>
              <input
                type="text"
                name="branch"
                value={queryParams.branch}
                onChange={handleChange}
                placeholder="e.g. Computer Science"
                className="w-full bg-[#F8F5EF] border border-border-slate focus:border-primary focus:bg-white rounded-input px-3.5 py-2.5 text-charcoal text-sm outline-none transition-colors placeholder:text-text-muted"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-border-slate">
            <button
              type="button"
              onClick={handleClear}
              className="px-5 py-2.5 bg-white border border-border-slate hover:bg-[#F8F5EF] text-text-secondary rounded-btn text-xs font-bold transition-all cursor-pointer"
            >
              Clear Filters
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-btn text-xs font-bold shadow-orange-sm transition-all cursor-pointer flex items-center justify-center min-w-[120px] disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                "Search Teammates"
              )}
            </button>
          </div>
        </form>

        {/* RESULTS GRID */}
        <div>
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-danger text-xs rounded-card text-center mb-6">
              {error}
            </div>
          )}

          {loading && users.length === 0 ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : users.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {users.map((item) => {
                const isMe = currentUser && (currentUser.id === item._id || currentUser._id === item._id);
                const isAvailable = item.availability === "Available" || !item.availability;

                return (
                  <div
                    key={item._id}
                    className="bg-card-surface border border-border-slate p-6 rounded-card hover:border-primary/50 hover:shadow-card transition-all flex flex-col justify-between group"
                  >
                    <div className="space-y-4">
                      
                      {/* User Info Header */}
                      <div className="flex items-center gap-3.5">
                        <div className="w-13 h-13 rounded-full overflow-hidden border border-border-slate bg-[#F8F5EF] shrink-0">
                          {item.profilePicture ? (
                            <img src={item.profilePicture} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center font-black text-sm bg-primary-tint text-primary">
                              {item.name ? item.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "TF"}
                            </div>
                          )}
                        </div>
                        
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="font-extrabold text-charcoal text-base group-hover:text-primary transition-colors truncate">
                              <Link to={`/profile/${item._id}`}>{item.name}</Link>
                            </h3>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase font-bold border tracking-wider shrink-0 flex items-center gap-1 ${
                              isAvailable
                                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                : "bg-amber-50 border-amber-200 text-amber-700"
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${isAvailable ? "bg-emerald-500" : "bg-amber-500"}`} />
                              <span>{item.availability || "Available"}</span>
                            </span>
                          </div>
                          <p className="text-text-muted text-xs truncate mt-0.5">
                            {item.college || "University Student"}
                          </p>
                        </div>
                      </div>

                      {/* Bio snippet */}
                      {item.bio ? (
                        <p className="text-text-secondary text-xs leading-relaxed line-clamp-2">
                          {item.bio}
                        </p>
                      ) : (
                        <p className="text-text-muted text-xs italic">
                          Student builder exploring new project collaborations.
                        </p>
                      )}

                      {/* Skills Chips */}
                      {item.skills && item.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {item.skills.slice(0, 4).map((skill) => (
                            <span
                              key={skill}
                              className="px-2.5 py-0.5 bg-[#F8F5EF] border border-border-slate text-[11px] rounded-md font-semibold text-charcoal"
                            >
                              {skill}
                            </span>
                          ))}
                          {item.skills.length > 4 && (
                            <span className="text-[11px] text-text-muted font-bold self-center pl-1">
                              +{item.skills.length - 4} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Card Actions Footer */}
                    <div className="border-t border-border-slate pt-4 mt-5 flex items-center justify-between">
                      <span className="text-[11px] text-text-muted uppercase tracking-wider font-bold">
                        {item.branch || item.year || "Engineer"}
                      </span>
                      <div className="flex items-center gap-3">
                        {!isMe && (
                          <Link
                            to={`/chat?type=direct&id=${item._id}`}
                            className="text-xs font-bold text-text-secondary hover:text-primary transition-colors flex items-center gap-1"
                            title="Direct Message"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            <span>Chat</span>
                          </Link>
                        )}
                        <Link
                          to={`/profile/${item._id}`}
                          className="text-xs font-bold text-primary hover:text-primary-hover flex items-center gap-1 transition-colors"
                        >
                          <span>Portfolio</span>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          ) : (
            !loading && (
              <div className="bg-card-surface border border-border-slate rounded-card p-16 text-center space-y-3 shadow-subtle">
                <div className="w-14 h-14 rounded-full bg-primary-tint mx-auto flex items-center justify-center text-primary text-2xl">
                  🔍
                </div>
                <h3 className="text-base font-bold text-charcoal">No students found</h3>
                <p className="text-xs text-text-muted max-w-sm mx-auto">
                  No teammates match your current search parameters. Try broadening your keywords or removing filters.
                </p>
                <button
                  onClick={handleClear}
                  className="mt-2 text-xs font-bold text-primary hover:text-primary-hover cursor-pointer"
                >
                  Clear all filters
                </button>
              </div>
            )
          )}
        </div>

      </div>
    </div>
  );
};

export default SearchUsers;
