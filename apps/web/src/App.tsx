import { BrowserRouter as Router, Routes, Route, useLocation, Navigate, useParams } from "react-router-dom";
import { Suspense, lazy, useEffect, useState, type ReactNode } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import AdminLayout from "./components/admin/AdminLayout";
import { Card, Spinner } from "./lib/heroui";
import {
  PUBLIC_THEME_STORAGE_KEY,
  PublicThemeContext,
  getNextPublicTheme,
  readStoredPublicTheme,
  type PublicTheme,
} from "./lib/public-theme";

const Home = lazy(() => import("./pages/Home"));
const SnippetDetail = lazy(() => import("./pages/SnippetDetail"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
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

function LegacySnippetRedirect() {
  const { slug } = useParams();
  return <Navigate to={slug ? `/snippets/${slug}` : "/"} replace />;
}

function LegacyAdminSnippetRedirect() {
  const { id } = useParams();
  return <Navigate to={id ? `/admin/snippets/${id}` : "/admin/snippets"} replace />;
}

function PublicRouteFallback() {
  return (
    <div className="public-route-fallback mx-auto flex w-full max-w-[1380px] flex-1 items-center justify-center px-6 py-20 md:px-8">
      <Card className="public-surface w-full max-w-xl rounded-[22px]">
        <Card.Content className="flex flex-col items-center gap-4 px-8 py-12 text-center">
          <Spinner size="lg" />
          <p className="type-mono-micro public-loading-label">Loading</p>
          <h2 className="type-card-title public-loading-title">Preparing the next view</h2>
          <p className="type-body-sm public-loading-copy max-w-md">
            Just Do Swift is loading the route shell and snippet content without blocking the rest of the app.
          </p>
        </Card.Content>
      </Card>
    </div>
  );
}

function AdminRouteFallback() {
  return (
    <div className="px-6 py-10 md:px-10 md:py-12">
      <Card className="rounded-[28px]">
        <Card.Content className="flex min-h-[260px] flex-col items-center justify-center gap-4 px-8 py-12 text-center">
          <Spinner size="lg" />
          <p className="type-mono-micro text-primary/40">Loading Workspace</p>
          <h2 className="type-card-title">Bringing the publishing surface online</h2>
          <p className="type-body-sm max-w-md">
            The admin shell is ready. Route content is streaming in as a separate chunk to keep the first load lighter.
          </p>
        </Card.Content>
      </Card>
    </div>
  );
}

function PublicShell({
  children,
  theme,
  onToggleTheme,
}: {
  children: ReactNode;
  theme: PublicTheme;
  onToggleTheme: () => void;
}) {
  return (
    <div
      className="public-theme min-h-screen flex flex-col relative"
      data-theme={theme}
      data-testid="public-theme-root"
    >
      <div className="vibe-grain" />
      <Navbar theme={theme} onToggleTheme={onToggleTheme} />
      <main className="flex-grow z-10">
        <Suspense fallback={<PublicRouteFallback />}>{children}</Suspense>
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  const [theme, setTheme] = useState<PublicTheme>(readStoredPublicTheme);

  useEffect(() => {
    window.localStorage.setItem(PUBLIC_THEME_STORAGE_KEY, theme);
  }, [theme]);

  return (
    <PublicThemeContext.Provider value={theme}>
      <Router>
        <ScrollToTop />
        <Routes>
          <Route
            path="/"
            element={
              <PublicShell theme={theme} onToggleTheme={() => setTheme((currentTheme) => getNextPublicTheme(currentTheme))}>
                <Home />
              </PublicShell>
            }
          />
          <Route
            path="/snippets/:slug"
            element={
              <PublicShell theme={theme} onToggleTheme={() => setTheme((currentTheme) => getNextPublicTheme(currentTheme))}>
                <SnippetDetail />
              </PublicShell>
            }
          />
          <Route
            path="/privacy-policy"
            element={
              <PublicShell theme={theme} onToggleTheme={() => setTheme((currentTheme) => getNextPublicTheme(currentTheme))}>
                <PrivacyPolicy />
              </PublicShell>
            }
          />
          <Route
            path="/terms-of-service"
            element={
              <PublicShell theme={theme} onToggleTheme={() => setTheme((currentTheme) => getNextPublicTheme(currentTheme))}>
                <TermsOfService />
              </PublicShell>
            }
          />
          <Route path="/articles/:slug" element={<LegacySnippetRedirect />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route
              index
              element={
                <Suspense fallback={<AdminRouteFallback />}>
                  <AdminDashboard />
                </Suspense>
              }
            />
            <Route path="articles" element={<Navigate to="/admin/snippets" replace />} />
            <Route path="articles/new" element={<Navigate to="/admin/snippets/new" replace />} />
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
        </Routes>
      </Router>
    </PublicThemeContext.Provider>
  );
}
