import { ArrowUpRight } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, Outlet } from "react-router-dom";
import { usePublicTheme } from "../../lib/public-theme";
import AdminSidebar from "./AdminSidebar";
import { type AdminHeaderConfig, type AdminHeaderOutletContext } from "./useAdminHeader";

export default function AdminLayout() {
  const theme = usePublicTheme();
  const [headerConfig, setHeaderConfig] = useState<AdminHeaderConfig | null>(null);
  const outletContext = useMemo<AdminHeaderOutletContext>(() => ({ setHeaderConfig }), []);
  const activeHeader: AdminHeaderConfig = headerConfig ?? {
    center: (
      <div className="admin-nav-inline-context min-w-0">
        <h1 className="admin-header-title truncate text-sm font-semibold">Admin Console</h1>
      </div>
    ),
  };

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
                className="admin-site-link type-action inline-flex h-11 shrink-0 items-center gap-2 rounded-xl px-3 md:px-4"
              >
                <span className="hidden md:inline">View Front Site</span>
                <span className="md:hidden">Site</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </header>

      <AdminSidebar />

      <div className="min-w-0 md:pl-24 xl:pl-28">
        <div className="admin-shell-width mx-auto">
          <Outlet context={outletContext} />
        </div>
      </div>
    </div>
  );
}
