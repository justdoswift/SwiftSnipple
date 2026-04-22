import { BrowserRouter as Router, Navigate, Outlet, Route, Routes, useLocation, useNavigate, useParams } from "react-router-dom";
import { Suspense, lazy, useEffect, useMemo, useState, type ReactNode } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import AdminLayout from "./components/admin/AdminLayout";
import { Spinner } from "./lib/heroui";
import { type AdminAuthSession } from "./lib/admin-auth";
import {
  LocaleContext,
  isAppLocale,
  localizeAdminPath,
  localizePublicPath,
  readStoredLocale,
  stripLocalePrefix,
  switchLocalePath,
  useAppLocale,
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
import { getAdminSession, logoutAdmin } from "./services/admin-auth";
import { getMemberSession, logoutMember } from "./services/member-auth";
import type { AppLocale, MemberSession } from "./types";

const Home = lazy(() => import("./pages/Home"));
const SnippetDetail = lazy(() => import("./pages/SnippetDetail"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const AccountPage = lazy(() => import("./pages/AccountPage"));
const AdminLoginPage = lazy(() => import("./pages/admin/AdminLoginPage"));
const AdminMembers = lazy(() => import("./pages/admin/AdminMembers"));
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
  const { locale } = useAppLocale();
  const copy = getMessages(locale).app;

  return (
    <div className="public-route-fallback mx-auto flex w-full max-w-[1380px] flex-1 items-center justify-center px-6 py-20 md:px-8">
      <div className="public-surface w-full max-w-xl px-8 py-12 text-center">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" />
          <p className="type-mono-micro public-loading-label">{copy.loading}</p>
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

function LegacySnippetRedirect() {
  const { slug } = useParams();
  return <Navigate to={localizePublicPath(slug ? `/snippets/${slug}` : "/")} replace />;
}

function LegacyAdminSnippetRedirect() {
  const { id } = useParams();
  return (
    <Navigate to={localizeAdminPath("en", id ? `/admin/snippets/${id}` : "/admin")} replace />
  );
}

function AdminLoginRedirect() {
  const locale = readStoredLocale();
  return <Navigate to={localizeAdminPath(locale, "/admin")} replace />;
}

function LegacyAdminRedirect() {
  const location = useLocation();
  const preferredLocale = readStoredLocale();
  return <Navigate to={localizeAdminPath(preferredLocale, stripLocalePrefix(location.pathname))} replace />;
}

function LegacyPublicRedirect() {
  const location = useLocation();
  const strippedPath = stripLocalePrefix(location.pathname);
  const normalizedPath = strippedPath.startsWith("/articles/")
    ? strippedPath.replace(/^\/articles\//, "/snippets/")
    : strippedPath;

  return <Navigate to={`${localizePublicPath(normalizedPath)}${location.search}${location.hash}`} replace />;
}

function AppLocaleGate() {
  const params = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const routeLocale = params.locale;
  const resolvedLocale = isAppLocale(routeLocale) ? routeLocale : readStoredLocale();

  useEffect(() => {
    if (isAppLocale(routeLocale)) {
      writeStoredLocale(routeLocale);
    }
  }, [routeLocale]);

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
  isResolved,
  children,
}: {
  authSession: AdminAuthSession | null;
  isResolved: boolean;
  children: ReactNode;
}) {
  const { locale } = useParams();
  const resolvedLocale = isAppLocale(locale) ? locale : readStoredLocale();
  if (!isResolved) {
    return <AdminRouteFallback />;
  }
  if (!authSession) {
    return <Navigate to={localizeAdminPath(resolvedLocale, "/admin/login")} replace />;
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
  authSession: MemberSession | null;
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
  const [authSession, setAuthSession] = useState<MemberSession | null>(null);
  const [adminAuthSession, setAdminAuthSession] = useState<AdminAuthSession | null>(null);
  const [isAdminAuthResolved, setIsAdminAuthResolved] = useState(false);

  useEffect(() => {
    window.localStorage.setItem(PUBLIC_THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    document.body.setAttribute("data-theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme((currentTheme) => getNextPublicTheme(currentTheme));
  const refreshMemberSession = async () => {
    try {
      const session = await getMemberSession();
      setAuthSession(session);
    } catch {
      setAuthSession(null);
    }
  };
  const handleAuthenticate = (session: MemberSession) => {
    setAuthSession(session);
  };
  const handleSignOut = async () => {
    await logoutMember();
    setAuthSession(null);
  };

  useEffect(() => {
    let active = true;

    getMemberSession()
      .then((session) => {
        if (!active) return;
        setAuthSession(session);
      })
      .catch(() => {
        if (!active) return;
        setAuthSession(null);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    getAdminSession()
      .then((session) => {
        if (!active) return;
        setAdminAuthSession(session);
      })
      .catch(() => {
        if (!active) return;
        setAdminAuthSession(null);
      })
      .finally(() => {
        if (!active) return;
        setIsAdminAuthResolved(true);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleAdminAuthenticate = (session: AdminAuthSession) => {
    setAdminAuthSession(session);
    setIsAdminAuthResolved(true);
  };
  const handleAdminSignOut = async () => {
    await logoutAdmin();
    setAdminAuthSession(null);
    setIsAdminAuthResolved(true);
  };

  return (
    <PublicThemeContext.Provider value={theme}>
      <Router>
        <ScrollToTop />
        <Routes>
          <Route element={<AppLocaleGate />}>
            <Route
              path="/"
              element={
                <PublicShell theme={theme} onToggleTheme={toggleTheme} authSession={authSession}>
                  <Home />
                </PublicShell>
              }
            />
            <Route
              path="/snippets/:slug"
              element={
                <PublicShell theme={theme} onToggleTheme={toggleTheme} authSession={authSession}>
                  <SnippetDetail />
                </PublicShell>
              }
            />
            <Route
              path="/privacy-policy"
              element={
                <PublicShell theme={theme} onToggleTheme={toggleTheme} authSession={authSession}>
                  <PrivacyPolicy />
                </PublicShell>
              }
            />
            <Route
              path="/terms-of-service"
              element={
                <PublicShell theme={theme} onToggleTheme={toggleTheme} authSession={authSession}>
                  <TermsOfService />
                </PublicShell>
              }
            />
            <Route
              path="/login"
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
              path="/account"
              element={
                <PublicShell theme={theme} onToggleTheme={toggleTheme} authSession={authSession}>
                  <AccountPage authSession={authSession} onSignOut={handleSignOut} onRefreshSession={refreshMemberSession} />
                </PublicShell>
              }
            />
            <Route
              path="/admin/login"
              element={
                !isAdminAuthResolved ? (
                  <AdminRouteFallback />
                ) : adminAuthSession ? (
                  <AdminLoginRedirect />
                ) : (
                  <Suspense fallback={<AdminRouteFallback />}>
                    <AdminLoginPage authSession={adminAuthSession} onAuthenticate={handleAdminAuthenticate} />
                  </Suspense>
                )
              }
            />
            <Route path="/articles/:slug" element={<LegacySnippetRedirect />} />
            <Route
              path="/admin"
              element={
                <AdminAuthGate authSession={adminAuthSession} isResolved={isAdminAuthResolved}>
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
                    <AdminSnippets />
                  </Suspense>
                }
              />
              <Route path="articles" element={<Navigate to="../" replace />} />
              <Route path="articles/new" element={<Navigate to="../snippets/new" replace />} />
              <Route path="articles/:id" element={<LegacyAdminSnippetRedirect />} />
              <Route
                path="members"
                element={
                  <Suspense fallback={<AdminRouteFallback />}>
                    <AdminMembers />
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
            <Route path="/:locale/admin/*" element={<LegacyAdminRedirect />} />
            <Route path="/:locale/*" element={<LegacyPublicRedirect />} />
            <Route path="*" element={<Navigate to={localizePublicPath("/")} replace />} />
          </Route>
        </Routes>
      </Router>
    </PublicThemeContext.Provider>
  );
}
