import { Monitor, Moon, Search, Sun } from "lucide-react";
import { Link } from "react-router-dom";
import { getMessages } from "../lib/messages";
import type { MockAuthSession } from "../lib/mock-auth";
import { useAppLocale } from "../lib/locale";
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
  const nextLocale = locale === "en" ? "zh" : "en";

  return (
    <nav
      className="public-nav-root fixed top-0 z-50 w-full"
      aria-label="Primary"
      data-theme={theme}
    >
      <div
        className="public-nav-shell mx-auto flex max-w-[1380px] items-center justify-between gap-3 px-4 py-3 md:px-6"
        data-testid="public-navbar-shell"
      >
        <Link to={`/${locale}`} className="public-nav-brand min-w-0" aria-label="Just Do Swift homepage">
          <span className="public-nav-logo" aria-hidden="true">
            <span className="public-nav-logo-bar public-nav-logo-bar-primary" />
            <span className="public-nav-logo-bar public-nav-logo-bar-secondary" />
          </span>
          <span className="truncate text-[1.05rem] font-semibold tracking-[-0.03em] md:text-[1.2rem]">
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

          <button
            type="button"
            className="public-nav-login-button type-action"
            onClick={() => setLocale?.(nextLocale)}
            aria-label={`Switch language to ${nextLocale}`}
          >
            {copy.nav.localeSwitch}
          </button>

          <Link to={authSession ? `/${locale}/account` : `/${locale}/login`} className="public-nav-login-button type-action">
            {authSession ? copy.nav.account : copy.nav.login}
          </Link>
        </div>
      </div>
    </nav>
  );
}
