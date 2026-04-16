import { FilePenLine, LayoutDashboard, LibraryBig, Plus } from "lucide-react";
import { NavLink } from "react-router-dom";

const NAV_ITEMS = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/admin/snippets", label: "Snippets", icon: LibraryBig },
  { to: "/admin/snippets/new", label: "New Snippet", icon: Plus },
];

export default function AdminSidebar() {
  return (
    <aside className="px-6 py-8 md:px-8">
      <div className="surface-card-subtle min-h-[calc(100vh-4rem)] rounded-[30px] px-6 py-8">
      <div className="mb-10">
        <p className="type-mono-micro text-primary/40">Snippet Console</p>
        <h1 className="type-section-title mt-3 text-[2rem]">Rebuilt in SwiftUI</h1>
        <p className="type-body-sm mt-3 max-w-xs">
          Publishing tools for drafting, staging, and shipping reusable SwiftUI entries.
        </p>
      </div>

      <nav className="space-y-2">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            end={end}
            to={to}
            className={({ isActive }) =>
              `flex items-center justify-between rounded-[22px] border px-4 py-4 transition-all ${
                isActive
                  ? "border-white/85 bg-white text-black shadow-[0_14px_30px_rgba(22,24,29,0.18)]"
                  : "border-white/55 bg-white/76 text-black/80 hover:border-white/75 hover:bg-white/88 hover:text-black"
              }`
            }
          >
            <span className="flex items-center gap-3 text-base font-semibold tracking-tight">
              <Icon className="h-4 w-4" />
              {label}
            </span>
            <FilePenLine className="h-3.5 w-3.5 opacity-60" />
          </NavLink>
        ))}
      </nav>
      </div>
    </aside>
  );
}
