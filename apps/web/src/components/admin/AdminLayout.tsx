import { ArrowUpRight, PanelLeftOpen } from "lucide-react";
import { Link, Outlet } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-surface">
      <div className="glass-header mx-4 mt-4 rounded-[24px] px-6 py-4 md:hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <PanelLeftOpen className="h-4 w-4" />
            <span className="type-mono-micro text-primary/50">Admin Console</span>
          </div>
          <Link
            to="/"
            className="type-action flex items-center gap-2 text-primary/60"
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
          <header className="mx-6 mt-6 hidden rounded-[28px] px-10 py-6 md:flex md:items-center md:justify-between glass-header">
            <div>
              <p className="type-mono-micro text-primary/40">Snippet Workspace</p>
              <p className="type-body-sm mt-2">
                Draft, stage, and publish SwiftUI snippets from one lightweight publishing surface.
              </p>
            </div>
            <Link
              to="/"
              className="type-action flex items-center gap-2 rounded-full border border-white/55 bg-white/72 px-4 py-3 text-primary shadow-[0_10px_24px_rgba(17,24,39,0.06)] transition-all hover:border-white/75 hover:bg-white/88"
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
