import { useEffect, useMemo, useState } from "react";
import AdminSnippetLibraryContent from "../../components/admin/AdminSnippetLibraryContent";
import StatCard from "../../components/admin/StatCard";
import { useAdminHeader } from "../../components/admin/useAdminHeader";
import { getSnippets } from "../../services/snippets";
import { Snippet } from "../../types";

export default function AdminDashboard() {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const headerConfig = useMemo(
    () => ({
      end: (
        <a
          href="/admin/snippets/new"
          className="admin-button-primary type-action inline-flex h-11 shrink-0 items-center px-4"
        >
          New Snippet
        </a>
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

  const draftCount = snippets.filter((snippet) => snippet.status === "Draft").length;
  const publishedCount = snippets.filter((snippet) => snippet.status === "Published").length;
  const reviewCount = snippets.filter((snippet) => snippet.status === "In Review").length;
  const scheduledCount = snippets.filter((snippet) => snippet.status === "Scheduled").length;

  return (
    <div className="px-6 py-10 md:px-8 md:py-12 xl:px-10">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Entries" value={snippets.length} note="Total snippets currently managed inside the publishing workspace." />
        <StatCard label="Drafts" value={draftCount} note="Snippets still being shaped before they go live." />
        <StatCard label="Published" value={publishedCount} note="Entries that are live and visible in the public library." />
        <StatCard label="Pipeline" value={reviewCount + scheduledCount} note="Snippets queued in review or already staged for release." />
      </section>

      <AdminSnippetLibraryContent snippets={snippets} isLoading={isLoading} error={error} />
    </div>
  );
}
