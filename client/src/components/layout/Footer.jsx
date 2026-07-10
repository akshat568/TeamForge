import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="border-t border-border-slate bg-bg-secondary py-12 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Brand Column */}
        <div className="space-y-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
              <span className="text-white font-black text-sm">T</span>
            </div>
            <span className="font-bold text-white tracking-tight">TeamForge</span>
          </Link>
          <p className="text-xs text-gray-400 leading-relaxed">
            One workspace for student teams to build projects, discover classmates, and showcase engineering portfolios.
          </p>
        </div>

        {/* Quick Links Column */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Quick Links</h4>
          <ul className="space-y-2 text-[15px]">
            <li>
              <Link to="/projects" className="text-gray-400 hover:text-primary-light transition-colors duration-150">Browse Projects</Link>
            </li>
            <li>
              <Link to="/register" className="text-gray-400 hover:text-primary-light transition-colors duration-150">Create Account</Link>
            </li>
            <li>
              <Link to="/login" className="text-gray-400 hover:text-primary-light transition-colors duration-150">Sign In</Link>
            </li>
          </ul>
        </div>

        {/* Features Column */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Platform Features</h4>
          <ul className="space-y-2 text-[15px] text-gray-400">
            <li>Kanban boards</li>
            <li>GitHub integrations</li>
            <li>Cloudinary storage</li>
            <li>Gemini assistant</li>
          </ul>
        </div>

        {/* Connect Column */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Connect</h4>
          <ul className="space-y-2 text-[15px]">
            <li>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-primary-light transition-colors duration-150">GitHub</a>
            </li>
            <li>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-primary-light transition-colors duration-150">LinkedIn</a>
            </li>
            <li>
              <Link to="/contact" className="text-gray-400 hover:text-primary-light transition-colors duration-150">Contact Support</Link>
            </li>
          </ul>
        </div>

      </div>

      <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-border-slate/50 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-4">
        <span>© {new Date().getFullYear()} TeamForge. All rights reserved.</span>
        <div className="flex gap-4 text-[15px]">
          <Link to="/privacy" className="hover:text-gray-400 transition-colors">Privacy Policy</Link>
          <Link to="/contact" className="hover:text-gray-400 transition-colors">Terms of Service</Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
