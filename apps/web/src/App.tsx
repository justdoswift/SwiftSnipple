import { BrowserRouter as Router, Navigate, Outlet, Route, Routes, useLocation, useNavigate, useParams } from "react-router-dom";
import { Suspense, lazy, useEffect, useMemo, useState, type ReactNode } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import AdminLayout from "./components/admin/AdminLayout";
import { Spinner } from "./lib/heroui";
import {
  clearStoredAdminAuth,
  readStoredAdminAuth,
  writeStoredAdminAuth,
  type AdminAuthSession,
} from "./lib/admin-auth";
import { clearStoredMockAuth, readStoredMockAuth, writeStoredMockAuth, type MockAuthSession } from "./lib/mock-auth";
import {
  LocaleContext,
  isAppLocale,
  localizePath,
  readStoredLocale,
  stripLocalePrefix,
  switchLocalePath,
  writeStoredLocale,
} from "./lib/locale";
import { getMessages } from "./lib/messages";
import {
  PUBLIC_THEME_STORAGE_KEY,
  PublicThemeContext,
  getNextPublicTheme,
  readStoredPublicTheme,
  type PublicTheme,
} from "./lib/public-theme";
import type { AppLocale } from "./types";

const Home = lazy(() => import("./pages/Home"));
const SnippetDetail = lazy(() => import("./pages/SnippetDetail"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const AccountPage = lazy(() => import("./pages/AccountPage"));
const AdminLoginPage = lazy(() => import("./pages/admin/AdminLoginPage"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminSnippets = lazy(() => import("./pages/admin/AdminSnippets"));
const AdminSnippetEditor = lazy(() => import("./pages/admin/AdminSnippetEditor"));

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function PublicRouteFallback() {
  const { locale } = useAppLocaleShell();
  const copy = getMessages(locale).app;

  return (
    <div className="public-route-fallback mx-auto flex w-full max-w-[1380px] flex-1 items-center justify-center px-6 py-20 md:px-8">
      <div className="public-surface w-full max-w-xl px-8 py-12 text-center">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" />
          <p className="type-mono-micro public-loading-label">{copy.loading}</p>
          <h2 className="type-card-title public-loading-title">{copy.loadingTitle}</h2>
          <p className="type-body-sm public-loading-copy max-w-md">{copy.loadingCopy}</p>
        </div>
      </div>
    </div>
  );
}

function AdminRouteFallback() {
  return (
    <div className="flex min-h-[260px] items-center justify-center px-6 py-10 md:px-10 md:py-12">
      <Spinner size="lg" />
    </div>
  );
}

function useAppLocaleShell() {
  const params = useParams();
  const locale = isAppLocale(params.locale) ? params.locale : readStoredLocale();
  return { locale };
}

function LegacySnippetRedirect() {
  const { locale, slug } = useParams();
  return <Navigate to={localizePath((locale as AppLocale) || "en", slug ? `/snippets/${slug}` : "/")} replace />;
}

function LegacyAdminSnippetRedirect() {
  const { locale, id } = useParams();
  return (
    <Navigate to={localizePath((locale as AppLocale) || "en", id ? `/admin/snippets/${id}` : "/admin/snippets")} replace />
  );
}

function AdminLoginRedirect() {
  const { locale } = useAppLocaleShell();
  return <Navigate to={localizePath(locale, "/admin")} replace />;
}

function LocalePrefixRedirect() {
  const location = useLocation();
  const preferredLocale = readStoredLocale();
  return <Navigate to={localizePath(preferredLocale, stripLocalePrefix(location.pathname))} replace />;
}

function LocaleGate() {
  const { locale } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const resolvedLocale = isAppLocale(locale) ? locale : readStoredLocale();

  useEffect(() => {
    if (!isAppLocale(locale)) {
      navigate(localizePath(resolvedLocale, stripLocalePrefix(location.pathname)), { replace: true });
      return;
    }
    writeStoredLocale(locale);
  }, [locale, location.pathname, navigate, resolvedLocale]);

  const contextValue = useMemo(
    () => ({
      locale: resolvedLocale,
      setLocale: (nextLocale: AppLocale) => {
        writeStoredLocale(nextLocale);
        navigate(switchLocalePath(location.pathname, nextLocale), { replace: true });
      },
    }),
    [location.pathname, navigate, resolvedLocale],
  );

  return (
    <LocaleContext.Provider value={contextValue}>
      <Outlet />
    </LocaleContext.Provider>
  );
}

function AdminAuthGate({
  authSession,
  children,
}: {
  authSession: AdminAuthSession | null;
  children: ReactNode;
}) {
  const { locale } = useAppLocaleShell();
  if (!authSession) {
    return <Navigate to={localizePath(locale, "/admin/login")} replace />;
  }

  return <>{children}</>;
}

function PublicShell({
  children,
  theme,
  onToggleTheme,
  authSession,
  showNavbar = true,
  showFooter = true,
}: {
  children: ReactNode;
  theme: PublicTheme;
  onToggleTheme: () => void;
  authSession: MockAuthSession | null;
  showNavbar?: boolean;
  showFooter?: boolean;
}) {
  return (
    <div className="public-theme relative flex min-h-screen flex-col" data-theme={theme} data-testid="public-theme-root">
      <div className="vibe-grain" />
      {showNavbar ? <Navbar theme={theme} onToggleTheme={onToggleTheme} authSession={authSession} /> : null}
      <main className="z-10 flex-grow">
        <Suspense fallback={<PublicRouteFallback />}>{children}</Suspense>
      </main>
      {showFooter ? <Footer /> : null}
    </div>
  );
}

export default function App() {
  const [theme, setTheme] = useState<PublicTheme>(readStoredPublicTheme);
  const [authSession, setAuthSession] = useState<MockAuthSession | null>(readStoredMockAuth);
  const [adminAuthSession, setAdminAuthSession] = useState<AdminAuthSession | null>(readStoredAdminAuth);

  useEffect(() => {
    window.localStorage.setItem(PUBLIC_THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    document.body.setAttribute("data-theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme((currentTheme) => getNextPublicTheme(currentTheme));
  const handleAuthenticate = (session: MockAuthSession, remember: boolean) => {
    writeStoredMockAuth(session, remember);
    setAuthSession(session);
  };
  const handleSignOut = () => {
    clearStoredMockAuth();
    setAuthSession(null);
  };
  const handleAdminAuthenticate = (session: AdminAuthSession) => {
    writeStoredAdminAuth(session);
    setAdminAuthSession(session);
  };
  const handleAdminSignOut = () => {
    clearStoredAdminAuth();
    setAdminAuthSession(null);
  };

  return (
    <PublicThemeContext.Provider value={theme}>
      <Router>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<LocalePrefixRedirect />} />
          <Route path="/:locale" element={<LocaleGate />}>
            <Route
              index
              element={
                <PublicShell theme={theme} onToggleTheme={toggleTheme} authSession={authSession}>
                  <Home />
                </PublicShell>
              }
            />
            <Route
              path="snippets/:slug"
              element={
                <PublicShell theme={theme} onToggleTheme={toggleTheme} authSession={authSession}>
                  <SnippetDetail />
                </PublicShell>
              }
            />
            <Route
              path="privacy-policy"
              element={
                <PublicShell theme={theme} onToggleTheme={toggleTheme} authSession={authSession}>
                  <PrivacyPolicy />
                </PublicShell>
              }
            />
            <Route
              path="terms-of-service"
              element={
                <PublicShell theme={theme} onToggleTheme={toggleTheme} authSession={authSession}>
                  <TermsOfService />
                </PublicShell>
              }
            />
            <Route
              path="login"
              element={
                <PublicShell
                  theme={theme}
                  onToggleTheme={toggleTheme}
                  authSession={authSession}
                  showNavbar={false}
                  showFooter={false}
                >
                  <LoginPage authSession={authSession} onAuthenticate={handleAuthenticate} />
                </PublicShell>
              }
            />
            <Route
              path="account"
              element={
                <PublicShell theme={theme} onToggleTheme={toggleTheme} authSession={authSession}>
                  <AccountPage authSession={authSession} onSignOut={handleSignOut} />
                </PublicShell>
              }
            />
            <Route
              path="admin/login"
              element={
                adminAuthSession ? (
                  <AdminLoginRedirect />
                ) : (
                  <Suspense fallback={<AdminRouteFallback />}>
                    <AdminLoginPage authSession={adminAuthSession} onAuthenticate={handleAdminAuthenticate} />
                  </Suspense>
                )
              }
            />
            <Route path="articles/:slug" element={<LegacySnippetRedirect />} />
            <Route
              path="admin"
              element={
                <AdminAuthGate authSession={adminAuthSession}>
                  <AdminLayout
                    adminAuthSession={adminAuthSession}
                    onSignOut={handleAdminSignOut}
                    onToggleTheme={toggleTheme}
                  />
                </AdminAuthGate>
              }
            >
              <Route
                index
                element={
                  <Suspense fallback={<AdminRouteFallback />}>
                    <AdminDashboard />
                  </Suspense>
                }
              />
              <Route path="articles" element={<Navigate to="../snippets" replace />} />
              <Route path="articles/new" element={<Navigate to="../snippets/new" replace />} />
              <Route path="articles/:id" element={<LegacyAdminSnippetRedirect />} />
              <Route
                path="snippets"
                element={
                  <Suspense fallback={<AdminRouteFallback />}>
                    <AdminSnippets />
                  </Suspense>
                }
              />
              <Route
                path="snippets/new"
                element={
                  <Suspense fallback={<AdminRouteFallback />}>
                    <AdminSnippetEditor />
                  </Suspense>
                }
              />
              <Route
                path="snippets/:id"
                element={
                  <Suspense fallback={<AdminRouteFallback />}>
                    <AdminSnippetEditor />
                  </Suspense>
                }
              />
            </Route>
            <Route path="*" element={<LocalePrefixRedirect />} />
          </Route>
          <Route path="*" element={<LocalePrefixRedirect />} />
        </Routes>
      </Router>
    </PublicThemeContext.Provider>
  );
}
