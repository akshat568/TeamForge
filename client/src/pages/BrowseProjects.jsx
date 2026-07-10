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
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, selectedCategory]);

  return (
    <div className="min-h-screen bg-bg-base text-white pt-28 pb-16 px-6 relative overflow-hidden">
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <span className="text-xs font-semibold text-primary-light uppercase tracking-widest bg-primary/10 px-3.5 py-1.5 rounded-full border border-primary/20">
              Discover Teams
            </span>
            <h1 className="text-3xl md:text-5xl font-black mt-4 tracking-tight">
              Explore Active <span className="gradient-text">Projects</span>
            </h1>
            <p className="text-gray-400 text-sm md:text-base mt-2 max-w-xl">
              Find projects that match your skills, interest, or academic goals and apply to collaborate.
            </p>
          </div>
          <div>
            <Link
              to="/projects/new"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-btn font-semibold text-white bg-primary hover:bg-primary-hover shadow-subtle transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Post a Project
            </Link>
          </div>
        </div>

        {/* Filter Controls Panel */}
        <div className="bg-bg-secondary border border-border-slate p-6 rounded-card mb-10 space-y-6 shadow-subtle">
          {/* Search bar */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by title, description, or key skills..."
              className="w-full bg-card-surface border border-border-slate focus:border-primary rounded-input py-4 pl-12 pr-4 text-white text-sm outline-none transition-colors placeholder:text-gray-500"
            />
          </div>

          {/* Categories Tab Selector */}
          <div className="flex flex-wrap gap-2 pt-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4.5 py-2.5 rounded-btn text-xs font-semibold border transition-all duration-200 cursor-pointer ${
                  selectedCategory === category
                    ? "bg-primary text-white border-transparent scale-[1.01]"
                    : "bg-card-surface border-border-slate text-gray-400 hover:text-white hover:border-primary"
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
              <div key={i} className="bg-card-surface border border-border-slate rounded-card p-6 h-60 animate-pulse flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="h-6 bg-primary/10 rounded w-1/3" />
                  <div className="h-7 bg-bg-base/40 rounded w-3/4" />
                  <div className="space-y-2">
                    <div className="h-4 bg-bg-base/40 rounded w-full" />
                    <div className="h-4 bg-bg-base/40 rounded w-5/6" />
                  </div>
                </div>
                <div className="h-10 bg-primary/10 rounded w-full mt-4" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16 bg-bg-secondary border border-danger/20 rounded-card shadow-subtle">
            <p className="text-danger text-lg mb-4">{error}</p>
            <button onClick={fetchProjects} className="px-5 py-2.5 rounded-btn text-sm font-semibold bg-primary hover:bg-primary-hover text-white transition-colors duration-200">
              Retry
            </button>
          </div>
        ) : projects.length === 0 ? (
          /* Empty state */
          <div className="text-center py-20 bg-bg-secondary border border-border-slate rounded-card shadow-subtle">
            <svg className="w-16 h-16 text-primary-light/40 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2m0 0V6a2 2 0 012-2h12a2 2 0 012 2v12" />
            </svg>
            <h3 className="text-xl font-bold text-white mb-2">No projects found</h3>
            <p className="text-gray-500 text-sm max-w-sm mx-auto leading-relaxed">
              We couldn't find any listings matching your current filter set. Try broadening your keywords.
            </p>
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("All");
              }}
              className="mt-6 text-xs font-semibold text-primary hover:text-primary-hover transition-colors"
            >
              Reset Filters
            </button>
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
