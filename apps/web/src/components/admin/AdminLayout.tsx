import { ArrowUpRight, PanelLeftOpen } from "lucide-react";
import { Link, Outlet } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-surface">
      <div className="border-b border-outline-variant/10 bg-surface/90 px-6 py-4 backdrop-blur-md md:hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <PanelLeftOpen className="h-4 w-4" />
            <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary/50">Admin Console</span>
          </div>
          <Link
            to="/"
            className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-primary/60"
          >
            Front Site <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      <div className="grid min-h-screen md:grid-cols-[280px_minmax(0,1fr)]">
        <div className="hidden md:block">
          <AdminSidebar />
        </div>
        <div className="min-w-0">
          <header className="hidden border-b border-outline-variant/10 px-10 py-6 md:flex md:items-center md:justify-between">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary/40">Snippet Workspace</p>
              <p className="mt-2 text-sm text-on-surface-variant">
                Draft, stage, and publish SwiftUI snippets from one lightweight publishing surface.
              </p>
            </div>
            <Link
              to="/"
              className="flex items-center gap-2 border border-outline-variant/15 bg-surface-container-lowest px-4 py-3 font-mono text-[10px] uppercase tracking-[0.2em] text-primary transition-colors hover:border-primary/25"
            >
              View Front Site <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </header>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
