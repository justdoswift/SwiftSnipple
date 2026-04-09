import { BrowserRouter as Router, Routes, Route, useLocation, Navigate, useParams } from "react-router-dom";
import { useEffect } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import SnippetDetail from "./pages/SnippetDetail";
import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminSnippets from "./pages/admin/AdminSnippets";
import AdminSnippetEditor from "./pages/admin/AdminSnippetEditor";
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

export default function App() {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        <Route
          path="/"
          element={
            <div className="min-h-screen flex flex-col">
              <Navbar />
              <main className="flex-grow">
                <Home />
              </main>
              <Footer />
            </div>
          }
        />
        <Route
          path="/snippets/:slug"
          element={
            <div className="min-h-screen flex flex-col">
              <Navbar />
              <main className="flex-grow">
                <SnippetDetail />
              </main>
              <Footer />
            </div>
          }
        />
        <Route path="/articles/:slug" element={<LegacySnippetRedirect />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="articles" element={<Navigate to="/admin/snippets" replace />} />
          <Route path="articles/new" element={<Navigate to="/admin/snippets/new" replace />} />
          <Route path="articles/:id" element={<LegacyAdminSnippetRedirect />} />
          <Route path="snippets" element={<AdminSnippets />} />
          <Route path="snippets/new" element={<AdminSnippetEditor />} />
          <Route path="snippets/:id" element={<AdminSnippetEditor />} />
        </Route>
      </Routes>
    </Router>
  );
}
