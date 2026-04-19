import { LayoutDashboard, LibraryBig } from "lucide-react";
import { NavLink } from "react-router-dom";
import { localizeAdminPath, useAppLocale } from "../../lib/locale";

const NAV_ITEMS = [
  { path: "/admin", label: "Overview", icon: LayoutDashboard, end: true },
  { path: "/admin/snippets", label: "Snippets", icon: LibraryBig },
];

export default function AdminSidebar() {
  const { locale } = useAppLocale();

  return (
    <aside className="admin-rail-shell fixed left-5 top-1/2 z-30 hidden -translate-y-1/2 md:block xl:left-8">
      <nav className="flex flex-col gap-5" aria-label="Admin sections">
        {NAV_ITEMS.map(({ path, label, icon: Icon, end }) => (
          <NavLink
            key={path}
            end={end}
            to={localizeAdminPath(locale, path)}
            className={({ isActive }) =>
              `admin-rail-link group flex items-center gap-3 ${isActive ? "admin-rail-link-active" : "admin-rail-link-inactive"}`
            }
          >
            {({ isActive }) => (
              <>
                <span className="admin-rail-line" data-active={isActive} aria-hidden="true" />
                <span className="admin-rail-icon" data-active={isActive} aria-hidden="true">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="admin-rail-label type-mono-micro">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
