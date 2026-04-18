import { ChevronDown, Monitor, Moon, Search, Sun } from "lucide-react";
import { Link } from "react-router-dom";
import { getMessages } from "../lib/messages";
import type { MockAuthSession } from "../lib/mock-auth";
import type { AppLocale } from "../types";
import { APP_LOCALE_OPTIONS, useAppLocale } from "../lib/locale";
import { getNextPublicTheme, type PublicTheme } from "../lib/public-theme";

interface NavbarProps {
  theme: PublicTheme;
  onToggleTheme: () => void;
  authSession: MockAuthSession | null;
}

export default function Navbar({ theme, onToggleTheme, authSession }: NavbarProps) {
  const { locale, setLocale } = useAppLocale();
  const copy = getMessages(locale);
  const nextTheme = getNextPublicTheme(theme);

  return (
    <nav
      className="public-nav-root fixed top-0 z-50 w-full"
      aria-label="Primary"
      data-theme={theme}
    >
      <div
        className="public-nav-shell mx-auto flex max-w-[1400px] items-center justify-between gap-3 px-8 py-3 md:px-12 lg:px-16"
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
          <label className="public-nav-search">
            <Search size={16} strokeWidth={2} aria-hidden="true" />
            <input
              type="search"
              aria-label={copy.nav.searchSnippets}
              placeholder={copy.nav.searchSnippets}
              autoComplete="off"
            />
            <span className="public-nav-search-shortcut" aria-hidden="true">
              <Monitor size={12} strokeWidth={1.9} />
              <span>K</span>
            </span>
          </label>

          <button
            type="button"
            className="public-nav-icon-button"
            aria-label={`Switch to ${nextTheme} site mode`}
            aria-pressed={theme === "light"}
            onClick={onToggleTheme}
          >
            {theme === "dark" ? <Sun size={16} strokeWidth={2} /> : <Moon size={16} strokeWidth={2} />}
          </button>

          <div className="public-nav-locale-shell">
            <select
              className="public-nav-locale-select type-action"
              aria-label={copy.nav.selectLanguage}
              value={locale}
              onChange={(event) => setLocale?.(event.target.value as AppLocale)}
            >
              {APP_LOCALE_OPTIONS.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.nativeLabel}
                </option>
              ))}
            </select>
            <ChevronDown size={14} strokeWidth={2} aria-hidden="true" />
          </div>

          <Link
            to={authSession ? `/${locale}/account` : `/${locale}/login`}
            className="public-nav-login-button public-nav-auth-button type-action"
          >
            {authSession ? copy.nav.account : copy.nav.login}
          </Link>
        </div>
      </div>
    </nav>
  );
}
