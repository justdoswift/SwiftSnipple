import { useEffect, useMemo, useState } from "react";
import AdminSnippetLibraryContent from "../../components/admin/AdminSnippetLibraryContent";
import { useAdminHeader } from "../../components/admin/useAdminHeader";
import { getMessages } from "../../lib/messages";
import { useAppLocale } from "../../lib/locale";
import { getSnippets } from "../../services/snippets";
import { Snippet } from "../../types";

export default function AdminSnippets() {
  const { locale } = useAppLocale();
  const copy = getMessages(locale).admin;
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const headerConfig = useMemo(
    () => ({
      center: (
        <div className="admin-nav-inline-context min-w-0">
          <h1 className="admin-header-title truncate">{copy.snippetLibrary}</h1>
        </div>
      ),
      end: (
        <a
          href={`/${locale}/admin/snippets/new`}
          className="admin-nav-action-button admin-create-button type-action inline-flex shrink-0 items-center"
        >
          {copy.newSnippet}
        </a>
      ),
    }),
    [copy.newSnippet, copy.snippetLibrary, locale],
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
    <div className="px-6 py-8 md:px-8 md:py-10 xl:px-10">
      <AdminSnippetLibraryContent snippets={snippets} isLoading={isLoading} error={error} />
    </div>
  );
}
