import { LibraryBig, Users } from "lucide-react";
import { NavLink } from "react-router-dom";
import { getMessages } from "../../lib/messages";
import { localizeAdminPath, useAppLocale } from "../../lib/locale";

export default function AdminSidebar() {
  const { locale } = useAppLocale();
  const copy = getMessages(locale).admin;
  const navItems = [
    { path: "/admin", label: copy.snippetLibrary, icon: LibraryBig, end: true },
    { path: "/admin/members", label: copy.members, icon: Users },
  ];

  return (
    <aside className="admin-rail-shell fixed left-5 top-1/2 z-30 hidden -translate-y-1/2 md:block xl:left-8">
      <nav className="flex flex-col gap-5" aria-label="Admin sections">
        {navItems.map(({ path, label, icon: Icon, end }) => (
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
