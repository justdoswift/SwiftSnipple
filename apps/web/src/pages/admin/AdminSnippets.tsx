import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AdminSnippetLibraryContent from "../../components/admin/AdminSnippetLibraryContent";
import { useAdminHeader } from "../../components/admin/useAdminHeader";
import { getSnippets } from "../../services/snippets";
import { Snippet } from "../../types";

export default function AdminSnippets() {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const headerConfig = useMemo(
    () => ({
      center: (
        <div className="admin-nav-inline-context min-w-0">
          <h1 className="admin-header-title truncate text-sm font-semibold">Snippet Library</h1>
        </div>
      ),
      end: (
        <Link
          to="/admin/snippets/new"
          className="admin-button-primary type-action inline-flex h-11 shrink-0 items-center px-4"
        >
          New Snippet
        </Link>
      ),
    }),
    [],
  );

  useAdminHeader(headerConfig);

  useEffect(() => {
    let active = true;
    setIsLoading(true);

    getSnippets()
      .then((items) => {
        if (!active) return;
        setSnippets(items);
        setError("");
      })
      .catch((err: Error) => {
        if (!active) return;
        setError(err.message);
      })
      .finally(() => {
        if (!active) return;
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="px-6 py-10 md:px-8 md:py-12 xl:px-10">
      <AdminSnippetLibraryContent snippets={snippets} isLoading={isLoading} error={error} />
    </div>
  );
}
