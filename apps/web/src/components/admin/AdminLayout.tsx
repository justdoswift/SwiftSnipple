import { ArrowUpRight, Languages, LogOut, Moon, Sun } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import type { AdminAuthSession } from "../../lib/admin-auth";
import { Dropdown, Tooltip } from "../../lib/heroui";
import { getMessages } from "../../lib/messages";
import { APP_LOCALE_OPTIONS, useAppLocale } from "../../lib/locale";
import { usePublicTheme } from "../../lib/public-theme";
import AdminSidebar from "./AdminSidebar";
import { type AdminHeaderConfig, type AdminHeaderOutletContext } from "./useAdminHeader";

interface AdminLayoutProps {
  adminAuthSession: AdminAuthSession | null;
  onSignOut: () => void;
  onToggleTheme?: () => void;
}

export default function AdminLayout({ adminAuthSession, onSignOut, onToggleTheme = () => {} }: AdminLayoutProps) {
  const theme = usePublicTheme();
  const { locale, setLocale } = useAppLocale();
  const copy = getMessages(locale);
  const themeToggleLabel = theme === "dark" ? copy.nav.switchToLightMode : copy.nav.switchToDarkMode;
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
        <div className="admin-nav-shell w-full px-4 py-3 md:px-6 lg:px-8" data-testid="admin-navbar-shell">
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
              <Tooltip delay={0} closeDelay={0}>
                <Tooltip.Trigger>
                  <button
                    type="button"
                    className="admin-nav-action-icon type-action"
                    aria-label={themeToggleLabel}
                    aria-pressed={theme === "light"}
                    onClick={onToggleTheme}
                  >
                    {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                  </button>
                </Tooltip.Trigger>
                <Tooltip.Content>
                  {themeToggleLabel}
                </Tooltip.Content>
              </Tooltip>
              <div className="admin-nav-locale-root">
                <Dropdown>
                  <Tooltip delay={0} closeDelay={0}>
                    <Tooltip.Trigger>
                      <Dropdown.Trigger
                        aria-label={copy.nav.selectLanguage}
                        className="admin-nav-action-icon admin-nav-locale-trigger type-action"
                      >
                        <span className="flex items-center justify-center" aria-hidden="true">
                          <Languages className="h-5 w-5" />
                        </span>
                      </Dropdown.Trigger>
                    </Tooltip.Trigger>
                    <Tooltip.Content>
                      {copy.nav.selectLanguage}
                    </Tooltip.Content>
                  </Tooltip>
                  <Dropdown.Popover>
                    <Dropdown.Menu
                      items={APP_LOCALE_OPTIONS}
                      selectionMode="single"
                      disallowEmptySelection
                      selectedKeys={[locale]}
                      onAction={(key) => setLocale?.(String(key) as typeof locale)}
                    >
                      {(option: (typeof APP_LOCALE_OPTIONS)[number]) => (
                        <Dropdown.Item id={option.code} textValue={option.nativeLabel}>
                          {option.nativeLabel}
                          <Dropdown.ItemIndicator />
                        </Dropdown.Item>
                      )}
                    </Dropdown.Menu>
                  </Dropdown.Popover>
                </Dropdown>
              </div>
              <Tooltip delay={0} closeDelay={0}>
                <Tooltip.Trigger>
                  <Link
                    to={`/${locale}`}
                    aria-label={copy.common.viewFrontSite}
                    className="admin-nav-action-icon"
                  >
                    <ArrowUpRight className="h-5 w-5" />
                  </Link>
                </Tooltip.Trigger>
                <Tooltip.Content>
                  {copy.common.viewFrontSite}
                </Tooltip.Content>
              </Tooltip>
              {adminAuthSession ? (
                <Tooltip delay={0} closeDelay={0}>
                  <Tooltip.Trigger>
                    <button
                      type="button"
                      aria-label={copy.common.logOut}
                      className="admin-nav-action-icon type-action"
                      onClick={onSignOut}
                    >
                      <LogOut className="h-5 w-5" />
                    </button>
                  </Tooltip.Trigger>
                  <Tooltip.Content>
                    {copy.common.logOut}
                  </Tooltip.Content>
                </Tooltip>
              ) : null}
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
