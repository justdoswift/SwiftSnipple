import { ArrowUpRight } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { usePublicTheme } from "../../lib/public-theme";
import AdminSidebar from "./AdminSidebar";
import { type AdminHeaderConfig, type AdminHeaderOutletContext } from "./useAdminHeader";

export default function AdminLayout() {
  const theme = usePublicTheme();
  const location = useLocation();
  const [headerConfig, setHeaderConfig] = useState<AdminHeaderConfig | null>(null);
  const outletContext = useMemo<AdminHeaderOutletContext>(() => ({ setHeaderConfig }), []);
  const isOverviewRoute = location.pathname === "/admin";
  const isEditorRoute =
    location.pathname === "/admin/snippets/new" ||
    (location.pathname.startsWith("/admin/snippets/") && location.pathname !== "/admin/snippets");
  const activeHeader: AdminHeaderConfig = headerConfig ?? {};

  return (
    <div className="admin-theme admin-page min-h-screen" data-theme={theme} data-testid="admin-theme-root">
      <header className="admin-nav-root sticky top-0 z-40 w-full" aria-label="Admin header">
        <div className="admin-nav-shell mx-auto max-w-[1380px] px-4 py-3 md:px-6" data-testid="admin-navbar-shell">
          <div className="admin-nav-main relative flex items-center justify-between gap-4">
            <Link to="/admin" className="admin-nav-brand min-w-0" aria-label="Just Do Swift admin">
              <span className="admin-nav-logo" aria-hidden="true">
                <span className="admin-nav-logo-bar admin-nav-logo-bar-primary" />
                <span className="admin-nav-logo-bar admin-nav-logo-bar-secondary" />
              </span>
              <span className="truncate text-[1.05rem] font-semibold tracking-[-0.03em] md:text-[1.2rem]">
                Just Do Swift
              </span>
            </Link>

            {activeHeader.center ? (
              <div className="admin-nav-context pointer-events-none absolute left-1/2 top-1/2 hidden min-w-0 max-w-[min(42vw,520px)] -translate-x-1/2 -translate-y-1/2 items-center justify-center text-center md:flex">
                {activeHeader.center}
              </div>
            ) : null}

            <div className="admin-nav-actions flex items-center justify-end gap-2">
              {activeHeader.end}
              <Link
                to="/"
                aria-label="View Front Site"
                className="admin-button-secondary inline-flex h-11 w-11 shrink-0 items-center justify-center px-0"
              >
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </header>

      {!isOverviewRoute && !isEditorRoute ? <AdminSidebar /> : null}

      <div
        className={`min-w-0 ${
          isOverviewRoute
            ? ""
            : isEditorRoute
              ? "md:px-24 xl:px-28"
              : "md:pl-24 xl:pl-28"
        }`}
        data-testid="admin-content-shell"
      >
        <div
          className={`admin-shell-width mx-auto ${isEditorRoute ? "admin-editor-shell-width" : ""}`}
          data-testid="admin-page-width-shell"
        >
          <Outlet context={outletContext} />
        </div>
      </div>
    </div>
  );
}
