import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import userService from "../services/userService";

const SearchUsers = () => {
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
      setError(err.message || "Failed to search users.");
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch on mount
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
    <div className="min-h-screen bg-bg-base text-white pt-32 pb-20 px-6">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* HEADER */}
        <div className="text-center max-w-xl mx-auto space-y-3">
          <span className="text-[14px] font-bold uppercase tracking-widest text-primary-light block">Directory</span>
          <h1 className="text-4xl md:text-[46px] font-extrabold leading-none tracking-tight text-white">
            Find Teammates
          </h1>
          <p className="text-white/75 text-[17px] leading-relaxed">
            Search for student developers, designers, and leads across different engineering colleges.
          </p>
        </div>

        {/* SEARCH FORM */}
        <form onSubmit={handleSubmit} className="bg-bg-secondary border border-border-slate rounded-card p-6 md:p-8 shadow-subtle space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Name</label>
              <input
                type="text"
                name="name"
                value={queryParams.name}
                onChange={handleChange}
                placeholder="e.g. Rahul"
                className="w-full bg-card-surface border border-border-slate focus:border-primary rounded-input px-3 py-2.5 text-white text-xs outline-none"
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">College</label>
              <input
                type="text"
                name="college"
                value={queryParams.college}
                onChange={handleChange}
                placeholder="e.g. VIT"
                className="w-full bg-card-surface border border-border-slate focus:border-primary rounded-input px-3 py-2.5 text-white text-xs outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Skills</label>
              <input
                type="text"
                name="skills"
                value={queryParams.skills}
                onChange={handleChange}
                placeholder="e.g. React, Python"
                className="w-full bg-card-surface border border-border-slate focus:border-primary rounded-input px-3 py-2.5 text-white text-xs outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Branch</label>
              <input
                type="text"
                name="branch"
                value={queryParams.branch}
                onChange={handleChange}
                placeholder="e.g. Computer Science"
                className="w-full bg-card-surface border border-border-slate focus:border-primary rounded-input px-3 py-2.5 text-white text-xs outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClear}
              className="px-5 py-2.5 bg-transparent border border-border-slate hover:border-gray-500 text-gray-300 hover:text-white rounded text-xs font-bold transition-all cursor-pointer"
            >
              Clear Filters
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white rounded text-xs font-bold shadow-subtle transition-all cursor-pointer flex items-center justify-center min-w-[100px]"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                "Search Users"
              )}
            </button>
          </div>
        </form>

        {/* RESULTS GRID */}
        <div>
          {error && (
            <div className="p-4 bg-danger/10 border border-danger/20 text-danger text-xs rounded text-center">
              {error}
            </div>
          )}

          {loading && users.length === 0 ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : users.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {users.map((item) => (
                <div
                  key={item._id}
                  className="bg-bg-secondary border border-border-slate p-6 rounded-card hover:border-primary/50 hover:shadow-[0_0_20px_rgba(37,99,235,0.06)] transition-all flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    
                    {/* User Info Header */}
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full overflow-hidden border border-border-slate bg-bg-base shrink-0">
                        {item.profilePicture ? (
                          <img src={item.profilePicture} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold text-xs bg-primary/20 text-primary-light">
                            {item.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                          </div>
                        )}
                      </div>
                      
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-white text-[17px] hover:text-primary-light transition-colors truncate">
                            <Link to={`/profile/${item._id}`}>{item.name}</Link>
                          </h3>
                          <span className={`px-1.5 py-0.5 rounded text-[8px] uppercase font-bold border tracking-wider shrink-0 ${
                            item.availability === "Available"
                              ? "bg-success/10 border-success/30 text-success"
                              : "bg-warning/10 border-warning/30 text-warning"
                          }`}>
                            {item.availability || "Available"}
                          </span>
                        </div>
                        <p className="text-gray-400 text-xs truncate">🎓 {item.college}</p>
                      </div>
                    </div>

                    {/* Bio snippet */}
                    {item.bio && (
                      <p className="text-gray-300 text-xs leading-relaxed line-clamp-2">
                        {item.bio}
                      </p>
                    )}

                    {/* Skills Chips */}
                    {item.skills && item.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {item.skills.slice(0, 4).map(skill => (
                          <span
                            key={skill}
                            className="px-2 py-0.5 bg-bg-base border border-border-slate/60 text-[10px] rounded font-medium text-gray-300"
                          >
                            {skill}
                          </span>
                        ))}
                        {item.skills.length > 4 && (
                          <span className="text-[10px] text-gray-500 self-center">+{item.skills.length - 4} more</span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="border-t border-border-slate/40 pt-4 mt-4 flex items-center justify-between">
                    <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">
                      {item.branch}
                    </span>
                    <Link
                      to={`/profile/${item._id}`}
                      className="text-xs font-bold text-primary hover:text-primary-hover flex items-center gap-1 transition-colors"
                    >
                      View Portfolio ➔
                    </Link>
                  </div>

                </div>
              ))}
            </div>
          ) : (
            !loading && (
              <div className="bg-bg-secondary border border-border-slate rounded-card p-16 text-center text-gray-500">
                <span className="text-4xl block mb-2">🔍</span>
                <p className="text-xs">No students matching your search filters were found.</p>
              </div>
            )
          )}
        </div>

      </div>
    </div>
  );
};

export default SearchUsers;
