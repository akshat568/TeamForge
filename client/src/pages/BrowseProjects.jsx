import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { getProjects } from "../services/projectService";
import ProjectCard from "../components/projects/ProjectCard";

const categories = ["All", "Hackathon", "Startup", "Open Source", "Research", "Personal Project"];

const BrowseProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError("");
      
      const filters = {};
      if (searchTerm.trim()) {
        filters.search = searchTerm.trim();
      }
      if (selectedCategory !== "All") {
        filters.category = selectedCategory;
      }
      
      const data = await getProjects(filters);
      if (data.success) {
        setProjects(data.projects);
      } else {
        setError("Failed to load projects");
      }
    } catch (err) {
      setError(err.message || "Something went wrong while fetching projects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchProjects();
    }, 350);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, selectedCategory]);

  return (
    <div className="min-h-screen bg-bg-base text-text-primary pt-28 pb-20 px-4 sm:px-6 lg:px-8 relative">
      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-primary bg-primary-tint px-3 py-1 rounded-full border border-primary/20">
              Discover Teams
            </span>
            <h1 className="text-3xl md:text-5xl font-black text-charcoal tracking-tight">
              Explore Active <span className="text-primary">Projects</span>
            </h1>
            <p className="text-text-muted text-sm md:text-base max-w-xl leading-relaxed">
              Find campus hackathons, student startups, and open-source projects looking for your exact skills and experience.
            </p>
          </div>
          <div>
            <Link
              to="/projects/new"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-btn font-bold text-sm text-white bg-primary hover:bg-primary-hover shadow-orange transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              <span>Post a Project</span>
            </Link>
          </div>
        </div>

        {/* Filter Controls Panel */}
        <div className="bg-card-surface border border-border-slate p-5 md:p-6 rounded-card mb-10 space-y-4 shadow-subtle">
          {/* Search bar */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-text-muted pointer-events-none">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by title, description, keywords, or skills (e.g. React, Python, UI/UX)..."
              className="w-full bg-[#F8F5EF] border border-border-slate focus:border-primary focus:bg-white rounded-input py-3.5 pl-12 pr-4 text-charcoal text-sm outline-none transition-colors placeholder:text-text-muted"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-xs font-bold text-text-muted hover:text-charcoal cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Categories Tab Selector */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs font-bold uppercase tracking-wider text-text-muted mr-1">
              Category:
            </span>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-btn text-xs font-bold transition-all duration-200 cursor-pointer ${
                  selectedCategory === category
                    ? "bg-primary text-white shadow-orange-sm"
                    : "bg-[#F8F5EF] border border-border-slate text-charcoal hover:border-primary/40 hover:bg-white"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Projects Grid / States */}
        {loading ? (
          /* Skeletons loader */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-card-surface border border-border-slate rounded-card p-6 h-64 animate-pulse flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="h-6 bg-primary-tint rounded-full w-1/3" />
                  <div className="h-6 bg-[#F0EAE1] rounded w-3/4" />
                  <div className="space-y-2">
                    <div className="h-4 bg-[#F0EAE1] rounded w-full" />
                    <div className="h-4 bg-[#F0EAE1] rounded w-4/5" />
                  </div>
                </div>
                <div className="h-10 bg-[#F8F5EF] rounded-btn w-full mt-4" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16 bg-card-surface border border-danger/20 rounded-card shadow-subtle space-y-4">
            <p className="text-danger font-semibold text-base">{error}</p>
            <button
              onClick={fetchProjects}
              className="px-6 py-2.5 rounded-btn text-xs font-bold bg-primary hover:bg-primary-hover text-white shadow-orange-sm transition-colors duration-200 cursor-pointer"
            >
              Retry Loading
            </button>
          </div>
        ) : projects.length === 0 ? (
          /* Empty state */
          <div className="text-center py-20 bg-card-surface border border-border-slate rounded-card shadow-subtle space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary-tint mx-auto flex items-center justify-center text-primary text-2xl">
              🔍
            </div>
            <h3 className="text-xl font-bold text-charcoal">No matching projects found</h3>
            <p className="text-text-muted text-sm max-w-sm mx-auto leading-relaxed">
              We couldn't find any listings matching your current search or category filter. Try clearing filters or posting a new listing.
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("All");
                }}
                className="px-5 py-2.5 rounded-btn text-xs font-bold text-primary bg-primary-tint hover:bg-primary-tint-hover border border-primary/20 transition-colors cursor-pointer"
              >
                Reset All Filters
              </button>
              <Link
                to="/projects/new"
                className="px-5 py-2.5 rounded-btn text-xs font-bold text-white bg-primary hover:bg-primary-hover shadow-orange-sm transition-colors cursor-pointer"
              >
                Create First Listing
              </Link>
            </div>
          </div>
        ) : (
          /* Projects grid list */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence>
              {projects.map((project) => (
                <ProjectCard key={project._id} project={project} />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default BrowseProjects;
