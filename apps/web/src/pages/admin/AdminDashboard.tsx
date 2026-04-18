import { useEffect, useMemo, useState } from "react";
import AdminSnippetLibraryContent from "../../components/admin/AdminSnippetLibraryContent";
import StatCard from "../../components/admin/StatCard";
import { useAdminHeader } from "../../components/admin/useAdminHeader";
import { getMessages } from "../../lib/messages";
import { useAppLocale } from "../../lib/locale";
import { getSnippets } from "../../services/snippets";
import { Snippet } from "../../types";

export default function AdminDashboard() {
  const { locale } = useAppLocale();
  const copy = getMessages(locale).admin;
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const headerConfig = useMemo(
    () => ({
      end: (
        <a
          href={`/${locale}/admin/snippets/new`}
          className="admin-button-primary admin-create-button type-action inline-flex h-11 shrink-0 items-center px-0"
        >
          {copy.newSnippet}
        </a>
      ),
    }),
    [copy.newSnippet, locale],
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

  const draftCount = snippets.filter((snippet) => snippet.status === "Draft").length;
  const publishedCount = snippets.filter((snippet) => snippet.status === "Published").length;
  const reviewCount = snippets.filter((snippet) => snippet.status === "In Review").length;
  const scheduledCount = snippets.filter((snippet) => snippet.status === "Scheduled").length;

  return (
    <div className="px-6 py-10 md:px-8 md:py-12 xl:px-10">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label={copy.entries} value={snippets.length} note={copy.entriesNote} />
        <StatCard label={copy.drafts} value={draftCount} note={copy.draftsNote} />
        <StatCard label={copy.published} value={publishedCount} note={copy.publishedNote} />
        <StatCard label={copy.pipeline} value={reviewCount + scheduledCount} note={copy.pipelineNote} />
      </section>

      <AdminSnippetLibraryContent snippets={snippets} isLoading={isLoading} error={error} />
    </div>
  );
}
