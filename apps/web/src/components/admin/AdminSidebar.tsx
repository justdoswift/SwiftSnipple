import { FilePenLine, LayoutDashboard, LibraryBig, Plus } from "lucide-react";
import { NavLink } from "react-router-dom";

const NAV_ITEMS = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/admin/articles", label: "Articles", icon: LibraryBig },
  { to: "/admin/articles/new", label: "New Entry", icon: Plus },
];

export default function AdminSidebar() {
  return (
    <aside className="border-r border-outline-variant/10 bg-surface-container-low/40 px-6 py-8 md:px-8">
      <div className="mb-10">
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-primary/40">Archive Console</p>
        <h1 className="mt-3 text-3xl font-black tracking-tighter">Rebuilt in SwiftUI</h1>
        <p className="mt-3 max-w-xs text-sm leading-relaxed text-on-surface-variant">
          Editorial tools for drafting, staging, and publishing long-form technical entries.
        </p>
      </div>

      <nav className="space-y-2">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            end={end}
            to={to}
            className={({ isActive }) =>
              `flex items-center justify-between border px-4 py-4 transition-colors ${
                isActive
                  ? "border-primary bg-primary text-white"
                  : "border-outline-variant/10 bg-surface-container-lowest text-primary hover:border-primary/25"
              }`
            }
          >
            <span className="flex items-center gap-3 text-sm font-semibold tracking-tight">
              <Icon className="h-4 w-4" />
              {label}
            </span>
            <FilePenLine className="h-3.5 w-3.5 opacity-60" />
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
