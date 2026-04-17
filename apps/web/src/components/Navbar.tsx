import { Monitor, Moon, Search, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

type HeaderTheme = "dark" | "light";

const STORAGE_KEY = "just-do-swift-header-theme";

function readStoredTheme(): HeaderTheme {
  if (typeof window === "undefined") {
    return "dark";
  }

  const value = window.localStorage.getItem(STORAGE_KEY);
  return value === "light" ? "light" : "dark";
}

export default function Navbar() {
  const [theme, setTheme] = useState<HeaderTheme>(readStoredTheme);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const nextTheme = theme === "dark" ? "light" : "dark";

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
        <Link to="/" className="public-nav-brand min-w-0" aria-label="Just Do Swift homepage">
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
              aria-label="Search snippets"
              placeholder="Search snippets"
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
            aria-label={`Switch to ${nextTheme} header mode`}
            aria-pressed={theme === "light"}
            onClick={() => setTheme(nextTheme)}
          >
            {theme === "dark" ? <Sun size={16} strokeWidth={2} /> : <Moon size={16} strokeWidth={2} />}
          </button>

          <Link to="/admin" className="public-nav-login-button type-action">
            Log in
          </Link>
        </div>
      </div>
    </nav>
  );
}
