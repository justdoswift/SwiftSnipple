import { ArrowUpRight, PanelLeftOpen } from "lucide-react";
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
    start: (
      <div className="min-w-0">
        <p className="admin-eyebrow type-mono-micro">Snippet Workspace</p>
        <h1 className="admin-header-title mt-2 truncate text-sm font-semibold">Admin Console</h1>
      </div>
    ),
  };
  const hasCenter = Boolean(activeHeader.center);

  return (
    <div className="admin-theme admin-page min-h-screen" data-theme={theme} data-testid="admin-theme-root">
      <div className="admin-mobile-header mx-4 mt-4 rounded-[24px] px-6 py-4 md:hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <PanelLeftOpen className="admin-icon-muted h-4 w-4" />
            <span className="admin-eyebrow type-mono-micro">Admin Console</span>
          </div>
          <Link
            to="/"
            className="admin-site-link type-action flex items-center gap-2"
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
          <div className="sticky top-4 z-40 mx-6 mt-6 hidden md:block">
            <header className="admin-header glass-header rounded-[28px] px-6 py-4 xl:px-8">
              {hasCenter ? (
                <div className="flex flex-col gap-4 xl:grid xl:grid-cols-[260px_minmax(0,1fr)_max-content] xl:items-center xl:gap-6 2xl:grid-cols-[320px_minmax(0,1fr)_max-content]">
                  <div className="min-w-0">
                    {activeHeader.start}
                  </div>
                  <div className="min-w-0">
                    {activeHeader.center}
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 2xl:gap-2 xl:flex-nowrap xl:justify-end">
                    {activeHeader.end}
                    <Link
                      to="/"
                      className="admin-site-link type-action inline-flex h-10 shrink-0 items-center gap-1 rounded-full px-2.5 min-[1500px]:gap-1.5 min-[1500px]:px-3 2xl:gap-2 2xl:px-4"
                    >
                      <span className="min-[1500px]:hidden">Site</span>
                      <span className="hidden min-[1500px]:inline min-[1850px]:hidden">Front Site</span>
                      <span className="hidden min-[1850px]:inline">View Front Site</span>
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:gap-6">
                  <div className="min-w-0 xl:flex-1">
                    {activeHeader.start}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 xl:ml-auto xl:justify-end">
                    {activeHeader.end}
                    <Link
                      to="/"
                      className="admin-site-link type-action inline-flex h-10 shrink-0 items-center gap-2 rounded-full px-4"
                    >
                      View Front Site <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              )}
            </header>
          </div>
          <Outlet context={outletContext} />
        </div>
      </div>
    </div>
  );
}
