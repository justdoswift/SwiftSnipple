import { Search } from "lucide-react";
import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-md border-b border-outline-variant/15 shadow-[0_20px_40px_rgba(25,28,30,0.04)]">
      <div className="flex justify-between items-center px-8 py-4 max-w-[1440px] mx-auto">
        <Link to="/" className="text-xl font-bold tracking-tighter text-primary font-sans">
          Rebuilt in SwiftUI
        </Link>
        
        <div className="hidden md:flex items-center gap-8 font-sans tracking-tight">
          <Link to="/" className="text-primary border-b border-primary pb-1 transition-colors duration-200">
            Browse
          </Link>
          <a href="/#archive-index" className="text-primary/60 hover:text-primary transition-colors duration-200">
            Archive
          </a>
          <a href="/#latest-additions" className="text-primary/60 hover:text-primary transition-colors duration-200">
            Articles
          </a>
          <a href="/#latest-additions" className="text-primary/60 hover:text-primary transition-colors duration-200">
            Latest
          </a>
          <Link to="/admin" className="text-primary/60 hover:text-primary transition-colors duration-200">
            Admin
          </Link>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center bg-surface-container-low rounded-full px-4 py-1.5 gap-2 cursor-pointer">
            <Search className="w-4 h-4 text-on-surface-variant" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant">Search Entries</span>
          </div>
          <Link
            to="/admin"
            className="bg-primary text-white px-5 py-2 text-sm font-medium hover:scale-[1.01] transition-transform"
          >
            Open Console
          </Link>
        </div>
      </div>
    </nav>
  );
}
