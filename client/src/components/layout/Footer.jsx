import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="border-t border-border-slate bg-[#F4EFE6]/80 text-text-primary py-16 px-4 sm:px-6 lg:px-8 mt-auto">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-10">
        
        {/* Brand Column */}
        <div className="md:col-span-4 space-y-4">
          <Link to="/" className="flex items-center gap-2.5 group w-fit">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-orange-sm group-hover:scale-105 transition-transform">
              <span className="text-white font-black text-base">TF</span>
            </div>
            <span className="text-xl font-extrabold text-charcoal tracking-tight">
              Team<span className="text-primary">Forge</span>
            </span>
          </Link>
          <p className="text-sm text-text-muted leading-relaxed max-w-sm">
            The dedicated project workspace for student developers, hackathon teams, and campus creators to assemble teams, plan sprints, and ship remarkable products.
          </p>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-border-slate text-xs font-semibold text-charcoal shadow-subtle">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span>Platform Operational & Active</span>
          </div>
        </div>

        {/* Quick Links Column */}
        <div className="md:col-span-2 md:col-start-6 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-charcoal">Platform</h4>
          <ul className="space-y-2.5 text-sm">
            <li>
              <Link to="/projects" className="text-text-muted hover:text-primary transition-colors font-medium">Browse Projects</Link>
            </li>
            <li>
              <Link to="/users" className="text-text-muted hover:text-primary transition-colors font-medium">Find Teammates</Link>
            </li>
            <li>
              <Link to="/about" className="text-text-muted hover:text-primary transition-colors font-medium">About TeamForge</Link>
            </li>
            <li>
              <Link to="/projects/new" className="text-text-muted hover:text-primary transition-colors font-medium">Post a Project</Link>
            </li>
          </ul>
        </div>

        {/* Workspace Features Column */}
        <div className="md:col-span-3 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-charcoal">Capabilities</h4>
          <ul className="space-y-2.5 text-sm text-text-muted font-medium">
            <li className="flex items-center gap-2">
              <span className="text-primary font-bold text-xs">✔</span>
              <span>Kanban Sprint Boards</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary font-bold text-xs">✔</span>
              <span>GitHub Branch & Commits</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary font-bold text-xs">✔</span>
              <span>Gemini AI Sprint Assistant</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary font-bold text-xs">✔</span>
              <span>Cloudinary Asset Storage</span>
            </li>
          </ul>
        </div>

        {/* Connect & Community Column */}
        <div className="md:col-span-2 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-charcoal">Community</h4>
          <ul className="space-y-2.5 text-sm">
            <li>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-primary transition-colors font-medium flex items-center gap-1.5">
                <span>GitHub</span>
                <svg className="w-3.5 h-3.5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </li>
            <li>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-primary transition-colors font-medium flex items-center gap-1.5">
                <span>LinkedIn</span>
                <svg className="w-3.5 h-3.5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </li>
            <li>
              <Link to="/contact" className="text-text-muted hover:text-primary transition-colors font-medium">Contact Support</Link>
            </li>
            <li>
              <Link to="/privacy" className="text-text-muted hover:text-primary transition-colors font-medium">Privacy Policy</Link>
            </li>
          </ul>
        </div>

      </div>

      <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-border-slate flex flex-col sm:flex-row items-center justify-between text-xs text-text-muted gap-4">
        <span>© {new Date().getFullYear()} TeamForge Inc. Designed for Student Developers.</span>
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-primary" />
            <span>Neon Orange + Porcelain Design System</span>
          </span>
          <Link to="/privacy" className="hover:text-charcoal transition-colors">Privacy</Link>
          <Link to="/contact" className="hover:text-charcoal transition-colors">Terms</Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
