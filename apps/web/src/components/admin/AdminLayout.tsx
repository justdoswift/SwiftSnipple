import { ArrowUpRight } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import type { AdminAuthSession } from "../../lib/admin-auth";
import { getMessages } from "../../lib/messages";
import { useAppLocale } from "../../lib/locale";
import { usePublicTheme } from "../../lib/public-theme";
import AdminSidebar from "./AdminSidebar";
import { type AdminHeaderConfig, type AdminHeaderOutletContext } from "./useAdminHeader";

interface AdminLayoutProps {
  adminAuthSession: AdminAuthSession | null;
  onSignOut: () => void;
}

export default function AdminLayout({ adminAuthSession, onSignOut }: AdminLayoutProps) {
  const theme = usePublicTheme();
  const { locale, setLocale } = useAppLocale();
  const copy = getMessages(locale);
  const location = useLocation();
  const [headerConfig, setHeaderConfig] = useState<AdminHeaderConfig | null>(null);
  const outletContext = useMemo<AdminHeaderOutletContext>(() => ({ setHeaderConfig }), []);
  const isOverviewRoute = location.pathname === `/${locale}/admin`;
  const isEditorRoute =
    location.pathname === `/${locale}/admin/snippets/new` ||
    (location.pathname.startsWith(`/${locale}/admin/snippets/`) && location.pathname !== `/${locale}/admin/snippets`);
  const activeHeader: AdminHeaderConfig = headerConfig ?? {};

  return (
    <div className="admin-theme admin-page min-h-screen" data-theme={theme} data-testid="admin-theme-root">
      <header className="admin-nav-root sticky top-0 z-40 w-full" aria-label="Admin header">
        <div className="admin-nav-shell mx-auto max-w-[1400px] px-8 py-3 md:px-12 lg:px-16" data-testid="admin-navbar-shell">
          <div className="admin-nav-main relative flex items-center justify-between gap-4">
            <Link to={`/${locale}/admin`} className="admin-nav-brand min-w-0" aria-label="Just Do Swift admin">
              <span className="admin-nav-logo" aria-hidden="true">
                <span className="admin-nav-logo-bar admin-nav-logo-bar-primary" />
                <span className="admin-nav-logo-bar admin-nav-logo-bar-secondary" />
              </span>
              <span className="admin-brand-title truncate">
                Just Do Swift
              </span>
            </Link>

            {activeHeader.center ? (
              <div className="admin-nav-context pointer-events-none absolute left-1/2 top-1/2 hidden min-w-0 max-w-[min(42vw,520px)] -translate-x-1/2 -translate-y-1/2 items-center justify-center text-center md:flex">
                {activeHeader.center}
              </div>
            ) : null}

            <div className="admin-nav-actions flex items-center justify-end gap-2 md:gap-3">
              {activeHeader.end}
              {adminAuthSession ? (
                <button
                  type="button"
                  className="admin-nav-action-button admin-auth-button type-action"
                  onClick={onSignOut}
                >
                  {copy.common.logOut}
                </button>
              ) : null}
              <button
                type="button"
                className="admin-nav-action-button admin-locale-button type-action"
                onClick={() => setLocale?.(locale === "en" ? "zh" : "en")}
              >
                {copy.nav.localeSwitch}
              </button>
              <Link
                to={`/${locale}`}
                aria-label={copy.common.viewFrontSite}
                className="admin-nav-action-icon"
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
