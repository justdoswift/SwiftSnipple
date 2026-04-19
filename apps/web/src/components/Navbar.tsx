import { Languages, LogIn, Moon, Search, Sun, User } from "lucide-react";
import { Link } from "react-router-dom";
import { getMessages } from "../lib/messages";
import { Dropdown, Tooltip } from "../lib/heroui";
import type { MockAuthSession } from "../lib/mock-auth";
import { APP_LOCALE_OPTIONS, useAppLocale } from "../lib/locale";
import type { PublicTheme } from "../lib/public-theme";

interface NavbarProps {
  theme: PublicTheme;
  onToggleTheme: () => void;
  authSession: MockAuthSession | null;
}

export default function Navbar({ theme, onToggleTheme, authSession }: NavbarProps) {
  const { locale, setLocale } = useAppLocale();
  const copy = getMessages(locale);
  const themeToggleLabel = theme === "dark" ? copy.nav.switchToLightMode : copy.nav.switchToDarkMode;
  const authLabel = authSession ? copy.nav.account : copy.nav.login;
  const authHref = authSession ? `/${locale}/account` : `/${locale}/login`;

  return (
    <nav
      className="public-nav-root fixed top-0 z-50 w-full"
      aria-label="Primary"
      data-theme={theme}
    >
      <div
        className="public-nav-shell flex w-full items-center justify-between gap-3 px-4 py-3 md:px-6 lg:px-8"
        data-testid="public-navbar-shell"
      >
        <Link to={`/${locale}`} className="public-nav-brand min-w-0" aria-label="Just Do Swift homepage">
          <span className="public-nav-logo" aria-hidden="true">
            <span className="public-nav-logo-bar public-nav-logo-bar-primary" />
            <span className="public-nav-logo-bar public-nav-logo-bar-secondary" />
          </span>
          <span className="site-brand-title truncate">
            Just Do Swift
          </span>
        </Link>

        <div className="flex min-w-0 items-center justify-end gap-2 md:gap-3">
          <Tooltip delay={0} closeDelay={0}>
            <Tooltip.Trigger>
              <button
                type="button"
                className="public-nav-icon-button"
                aria-label={copy.nav.searchSnippets}
              >
                <Search size={18} strokeWidth={2} aria-hidden="true" />
              </button>
            </Tooltip.Trigger>
            <Tooltip.Content>
              {copy.nav.searchSnippets}
            </Tooltip.Content>
          </Tooltip>

          <Tooltip delay={0} closeDelay={0}>
            <Tooltip.Trigger>
              <button
                type="button"
                className="public-nav-icon-button"
                aria-label={themeToggleLabel}
                aria-pressed={theme === "light"}
                onClick={onToggleTheme}
              >
                {theme === "dark" ? <Sun size={16} strokeWidth={2} /> : <Moon size={16} strokeWidth={2} />}
              </button>
            </Tooltip.Trigger>
            <Tooltip.Content>
              {themeToggleLabel}
            </Tooltip.Content>
          </Tooltip>

          <div className="public-nav-locale-root">
            <Dropdown>
              <Tooltip delay={0} closeDelay={0}>
                <Tooltip.Trigger>
                  <Dropdown.Trigger
                    aria-label={copy.nav.selectLanguage}
                    className="public-nav-icon-button public-nav-locale-trigger type-action"
                  >
                    <Languages size={18} strokeWidth={2} aria-hidden="true" />
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
                to={authHref}
                aria-label={authLabel}
                className="public-nav-icon-button public-nav-auth-button type-action"
              >
                {authSession ? <User size={18} strokeWidth={2} aria-hidden="true" /> : <LogIn size={18} strokeWidth={2} aria-hidden="true" />}
              </Link>
            </Tooltip.Trigger>
            <Tooltip.Content>
              {authLabel}
            </Tooltip.Content>
          </Tooltip>
        </div>
      </div>
    </nav>
  );
}
