import { Button, Card, ProgressBar } from "../../lib/heroui";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import StatCard from "../../components/admin/StatCard";
import StatusBadge from "../../components/admin/StatusBadge";
import { useAdminHeader } from "../../components/admin/useAdminHeader";
import { getSnippets } from "../../services/snippets";
import { Snippet } from "../../types";

function formatDate(value: string | null) {
  if (!value) return "Not scheduled";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export default function AdminDashboard() {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const headerConfig = useMemo(
    () => ({
      start: (
        <div className="min-w-0">
          <p className="type-mono-micro text-white/30">Snippet Workspace</p>
          <h1 className="mt-2 truncate text-sm font-semibold text-white/90">Overview</h1>
        </div>
      ),
      end: (
        <Link
          to="/admin/snippets/new"
          className="admin-button-primary type-action inline-flex h-10 shrink-0 items-center px-4 text-black"
        >
          Start New Snippet
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

  const draftCount = snippets.filter((snippet) => snippet.status === "Draft").length;
  const publishedCount = snippets.filter((snippet) => snippet.status === "Published").length;
  const reviewCount = snippets.filter((snippet) => snippet.status === "In Review").length;
  const scheduledCount = snippets.filter((snippet) => snippet.status === "Scheduled").length;
  const recentSnippets = snippets.slice(0, 3);

  return (
    <div className="px-6 py-10 md:px-10 md:py-12">
      <section className="space-y-3">
        {isLoading ? <p className="type-body-sm text-primary/50">Loading snippet metrics...</p> : null}
        {error ? <p className="type-body-sm text-red-600">{error}</p> : null}
        {!isLoading && !error ? (
          <p className="type-body-sm text-primary/45">
            Track recent edits, release pacing, and the current status mix without leaving the admin workspace.
          </p>
        ) : null}
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Entries" value={snippets.length} note="Total snippets currently managed inside the publishing workspace." />
        <StatCard label="Drafts" value={draftCount} note="Snippets still being shaped before they go live." />
        <StatCard label="Published" value={publishedCount} note="Entries that are live and visible in the public library." />
        <StatCard label="Pipeline" value={reviewCount + scheduledCount} note="Snippets queued in review or already staged for release." />
      </section>

      <section className="mt-10 grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_360px]">
        <Card className="rounded-[28px]">
          <Card.Header className="flex items-end justify-between border-b border-white/55 px-6 py-5 md:px-8">
            <div>
              <p className="type-mono-micro text-primary/40">Recent Activity</p>
              <h2 className="type-section-title mt-3 text-[1.9rem]">Latest edits and launches</h2>
            </div>
            <Link
              to="/admin/snippets"
              className="type-action text-primary/60 transition-colors hover:text-primary"
            >
              Open list
            </Link>
          </Card.Header>
          <Card.Content className="divide-y divide-outline-variant/10 p-0">
            {!isLoading && !recentSnippets.length ? (
              <div className="px-6 py-10 text-center">
                <p className="type-mono-micro text-primary/35">No activity yet</p>
                <p className="type-body-sm mt-3">
                  Create the first snippet to start the publishing timeline.
                </p>
              </div>
            ) : null}
            {recentSnippets.map((snippet) => (
              <Link
                key={snippet.id}
                to={`/admin/snippets/${snippet.id}`}
                className="grid gap-5 px-6 py-6 transition-colors hover:bg-white/38 md:grid-cols-[1fr_auto]"
              >
                <div>
                  <p className="type-mono-micro text-primary/35">{snippet.category}</p>
                  <h3 className="type-card-title mt-2 text-[1.35rem]">{snippet.title}</h3>
                  <p className="type-body-sm mt-3 max-w-2xl">{snippet.excerpt}</p>
                </div>
                <div className="flex flex-col items-start gap-4 md:items-end">
                  <StatusBadge status={snippet.status} />
                  <span className="type-mono-micro text-primary/40">
                    Updated {formatDate(snippet.updatedAt)}
                  </span>
                </div>
              </Link>
            ))}
          </Card.Content>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-[26px]">
            <Card.Content className="p-6">
            <p className="type-mono-micro text-primary/40">Status Mix</p>
            <div className="mt-6 space-y-4">
              {[
                ["Draft", draftCount],
                ["In Review", reviewCount],
                ["Scheduled", scheduledCount],
                ["Published", publishedCount],
              ].map(([label, count]) => (
                <div key={label} className="grid grid-cols-[110px_1fr_auto] items-center gap-4">
                  <span className="type-mono-micro text-primary/50">{label}</span>
                  <ProgressBar
                    aria-label={`${label} ratio`}
                    className="w-full"
                    value={snippets.length ? (Number(count) / snippets.length) * 100 : 0}
                  />
                  <span className="text-sm font-semibold">{count}</span>
                </div>
              ))}
            </div>
            </Card.Content>
          </Card>

          <Card className="rounded-[28px] bg-primary-container text-white">
            <Card.Content className="p-6">
            <p className="type-mono-micro text-white/50">Next Up</p>
            <h2 className="type-section-title mt-3 text-[1.9rem] text-white">Ship the next entry faster</h2>
            <p className="type-body-sm mt-3 text-white/70">
              Shape the snippet metadata first, then refine the notes and preview until the public card feels right.
            </p>
            <Button
              className="type-action mt-6 bg-white text-black hover:bg-white/90"
              radius="full"
              onPress={() => {
                window.location.href = "/admin/snippets/new";
              }}
            >
              Start new snippet
            </Button>
            </Card.Content>
          </Card>

          <Card className="rounded-[26px]">
            <Card.Content className="p-6">
            <p className="type-mono-micro text-primary/40">Scheduled Release</p>
            <h2 className="type-card-title mt-3 text-[1.35rem]">
              {snippets.find((snippet) => snippet.status === "Scheduled")?.title ?? "No scheduled snippet"}
            </h2>
            <p className="type-body-sm mt-3">
              {snippets.find((snippet) => snippet.status === "Scheduled")?.publishedAt
                ? `Queued for ${formatDate(snippets.find((snippet) => snippet.status === "Scheduled")?.publishedAt ?? null)}`
                : "Nothing is queued for release right now."}
            </p>
            </Card.Content>
          </Card>
        </div>
      </section>
    </div>
  );
}
